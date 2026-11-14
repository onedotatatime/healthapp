"""Static serving of the chat bridge (MIN-4497, CTO S1 on comment 420bf529): the page folder at `/` and one extra folder at `/how-it-works/`.

Rules under test: Host is checked on EVERY static request like /chat (a DNS-rebinding page must not read a file), a path is resolved with realpath and
must stay inside its own folder, a dot file or folder is never served, there is no directory listing, and no folder inside the key folder is served."""
import os
import socket
import subprocess
import sys
import unittest

from chat_testkit import ChatCase, KEY, wait_for
import chat_bridge as B

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def raw_request(port, text):
    """(status code, raw response bytes) of a hand-written request: for the cases http.client will not send (no Host, two Hosts)."""
    s = socket.create_connection(("127.0.0.1", port), 5)
    s.sendall(text.encode())
    data = b""
    while True:
        chunk = s.recv(4096)
        if not chunk:
            break
        data += chunk
    s.close()
    return int(data.split(b" ", 2)[1]), data


class StaticServing(ChatCase):
    def make(self, **cfg):
        return super().make(static=True, **cfg)

    def page(self, env, path, **kw):
        return env.call("GET", path, key=False, origin=False, **kw)

    def test_premise_a_good_host_is_served(self):
        env = self.make()
        st, raw, _ = self.page(env, "/index.html")
        self.assertEqual((st, raw), (200, b"<h1>page</h1>"))
        st, raw, _ = self.page(env, "/how-it-works/")
        self.assertEqual((st, raw), (200, b"<h1>how it works</h1>"))

    def test_every_static_request_checks_host(self):
        """Measured before the fix: `Host: evil.example:8779` got 200 on a page. A rebinding page could then read any file the bridge serves."""
        env = self.make()
        for path in ("/index.html", "/", "/sub/page.html", "/how-it-works/", "/how-it-works/a.css", "/how-it-works", "/nope.html", "/.hidden.html"):
            for host in ("evil.example:%d" % env.port, "evil.example", "127.0.0.1", "localhost:%d" % env.port, "127.0.0.1:%d" % (env.port + 1),
                         "[::1]:%d" % env.port, "0.0.0.0:%d" % env.port, "127.0.0.1.evil.example:%d" % env.port):
                with self.subTest(path=path, host=host):
                    st, body, _ = self.page(env, path, host=host)
                    self.assertEqual((st, body), (403, {}))
        for method in ("HEAD",):
            for host in ("evil.example:%d" % env.port, "127.0.0.1"):
                st, _, _ = env.call(method, "/index.html", key=False, origin=False, host=host)
                self.assertEqual(st, 403, (method, host))

    def test_no_host_header_and_two_host_headers_are_refused(self):
        env = self.make()
        st, data = raw_request(env.port, "GET /index.html HTTP/1.0\r\n\r\n")
        self.assertEqual(st, 403)
        self.assertNotIn(b"page", data)
        good = "127.0.0.1:%d" % env.port
        st, data = raw_request(env.port, "GET /index.html HTTP/1.1\r\nHost: %s\r\nHost: evil.example\r\nConnection: close\r\n\r\n" % good)
        self.assertEqual(st, 403)
        st, data = raw_request(env.port, "GET /index.html HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n\r\n" % good)      # control
        self.assertEqual(st, 200)

    def test_the_extra_folder_is_served_at_its_name_with_an_index_and_a_redirect(self):
        env = self.make()
        st, raw, hdrs = self.page(env, "/how-it-works/a.css")
        self.assertEqual((st, raw), (200, b"body{}"))
        self.assertTrue(hdrs["content-type"].startswith("text/css"))
        st, raw, _ = self.page(env, "/how-it-works/sub/")
        self.assertEqual((st, raw), (200, b"extra sub"))
        for path, to in (("/how-it-works", "/how-it-works/"), ("/how-it-works/sub", "/how-it-works/sub/"), ("/sub", "/sub/")):
            st, _, hdrs = self.page(env, path)
            self.assertEqual(st, 301, path)
            self.assertEqual(hdrs["location"], to)
        st, raw, _ = self.page(env, "/sub/")                                              # the page folder is unchanged
        self.assertEqual((st, raw), (200, b"<h1>sub</h1>"))
        st, _, _ = self.page(env, "/a.css")                                               # the extra folder's files are not at the root
        self.assertEqual(st, 404)
        st, _, _ = self.page(env, "/how-it-works/index.html")
        self.assertEqual(st, 200)

    def test_no_directory_listing_anywhere(self):
        env = self.make()
        for path in ("/emptydir/", "/emptydir", "/how-it-works/emptydir/", "/how-it-works/emptydir", "/link-out/", "/how-it-works/link-out/"):
            with self.subTest(path=path):
                st, body, hdrs = self.page(env, path)
                self.assertIn(st, (301, 404))
                text = body if isinstance(body, bytes) else str(body).encode()
                self.assertNotIn(b"keep.txt", text)
                self.assertNotIn(b"Directory listing", text)
        st, body, _ = self.page(env, "/how-it-works/emptydir/")
        self.assertEqual(st, 404)

    def test_dot_files_and_dot_folders_are_never_served(self):
        env = self.make()
        for path in ("/.hidden.html", "/.dotdir/x.html", "/.dotdir/", "/how-it-works/.env", "/how-it-works/.hidden.html", "/%2ehidden.html", "/%2Ehidden.html",
                     "/.%68idden.html", "/how-it-works/%2eenv", "/sub/../.hidden.html", "/./.hidden.html", "//.hidden.html"):
            with self.subTest(path=path):
                st, body, _ = self.page(env, path)
                self.assertEqual((st, body), (404, {}))

    def test_traversal_never_leaves_the_folder(self):
        env = self.make()
        for path in ("/../outside/secret.html", "/%2e%2e/outside/secret.html", "/..%2foutside/secret.html", "/how-it-works/../index.html",
                     "/how-it-works/%2e%2e/index.html", "/how-it-works/../../outside/secret.html", "/sub/%2e%2e/%2e%2e/outside/secret.html",
                     "/..\\outside\\secret.html", "/%5c..%5coutside%5csecret.html", "/index.html%00.css", "/%00"):
            with self.subTest(path=path):
                st, body, _ = self.page(env, path)
                self.assertNotEqual(st, 200)
                self.assertNotIn(b"OUTSIDE-SECRET", body if isinstance(body, bytes) else b"")

    def test_a_symlink_that_leaves_the_folder_gives_404(self):
        """The file is checked by realpath, per request: a link out of the folder, a link to a file outside, an index that is a link out, a link to another
        served folder, and a link that lands on a dot file inside the folder."""
        env = self.make()
        for path in ("/link-secret.html", "/link-out/secret.html", "/index-link/", "/link-dot.html", "/how-it-works/link-out/secret.html",
                     "/how-it-works/link-pages/index.html", "/how-it-works/link-env"):
            with self.subTest(path=path):
                st, body, _ = self.page(env, path)
                self.assertEqual((st, body), (404, {}))
        st, _, _ = self.page(env, "/sub/page.html")                                       # the control: a real file in the same folder
        self.assertEqual(st, 200)

    def test_chat_routes_and_the_methods_are_unchanged(self):
        env = self.make()
        st, body, _ = env.get("/chat/health")
        self.assertEqual(st, 200)
        st, body, _ = env.call("GET", "/chat/health", key=False)
        self.assertEqual((st, body), (403, {}))
        st, body, _ = env.call("GET", "/chat/health", host="evil.example:%d" % env.port)
        self.assertEqual((st, body), (403, {}))
        self.assertEqual(env.call("POST", "/index.html", {}, key=False)[0], 405)
        self.assertEqual(env.call("PUT", "/index.html", key=False)[0], 405)
        self.assertEqual(env.call("OPTIONS", "/how-it-works/", key=False)[0], 403)
        self.assertEqual(env.records(), [])                                                # nothing here ever starts a turn

    def test_a_static_response_never_carries_a_key(self):
        env = self.make()
        for path in ("/index.html", "/how-it-works/", "/nope"):
            st, body, hdrs = self.page(env, path)
            self.assertNotIn(KEY.encode(), body if isinstance(body, bytes) else str(body).encode())
            self.assertFalse([h for h in hdrs if h.startswith("access-control")])


class MakeServerExtraDirs(ChatCase):
    def test_an_extra_folder_inside_or_around_or_equal_to_the_home_folder_is_refused(self):
        env = self.make()
        os.makedirs(os.path.join(env.home, "www"))
        for folder in (env.home, os.path.join(env.home, "www"), os.path.dirname(env.home)):
            with self.subTest(folder=folder):
                with self.assertRaises(SystemExit):
                    B.make_server(env.home, env.pages, 0, env.settings, [], key=KEY, extra_dirs={"how-it-works": folder})

    def test_a_page_folder_inside_the_key_folder_is_still_refused(self):
        env = self.make()
        os.makedirs(os.path.join(env.home, "local"))
        with self.assertRaises(SystemExit):
            B.make_server(env.home, os.path.join(env.home, "local"), 0, env.settings, [], key=KEY)

    def test_a_symlink_to_the_key_folder_is_refused_by_its_real_path(self):
        env = self.make()
        link = os.path.join(env.tmp, "www-link")
        os.symlink(env.home, link)
        with self.assertRaises(SystemExit):
            B.make_server(env.home, env.pages, 0, env.settings, [], key=KEY, extra_dirs={"how-it-works": link})

    def test_bad_names_and_missing_folders_are_refused(self):
        env = self.make()
        for name in ("chat", "", "A", "a b", "../x", "a/b", ".x", "-x", "x" * 60):
            with self.subTest(name=name):
                with self.assertRaises(SystemExit):
                    B.make_server(env.home, env.pages, 0, env.settings, [], key=KEY, extra_dirs={name: env.pages})
        with self.assertRaises(SystemExit):
            B.make_server(env.home, env.pages, 0, env.settings, [], key=KEY, extra_dirs={"how-it-works": os.path.join(env.tmp, "no-such-folder")})

    def test_a_good_extra_folder_is_accepted_and_kept_as_a_real_path(self):
        env = self.make(static=True)
        self.assertEqual(env.server.extra_dirs, {"how-it-works": os.path.realpath(os.path.join(env.tmp, "extra"))})
        self.assertEqual(env.server.page_dir, os.path.realpath(env.pages))


class ExtraDirOnTheCommandLine(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.tmp = os.path.realpath(tempfile.mkdtemp(prefix="static-cli-"))
        self.addCleanup(os.system, "rm -rf %s" % self.tmp)
        j = lambda *p: os.path.join(self.tmp, *p)
        for d in ("home", "pages", "www/how-it-works"):
            os.makedirs(j(*d.split("/")))
        open(j("pages", "index.html"), "w").write("page")
        open(j("www", "how-it-works", "index.html"), "w").write("how it works")
        open(j("home", "chat.key"), "w").write(KEY)
        self.home, self.pages, self.extra = j("home"), j("pages"), j("www", "how-it-works")

    def free_port(self):
        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
        s.close()
        return port

    def run_bridge(self, *extra_args):
        port = self.free_port()
        p = subprocess.Popen([sys.executable, os.path.join(HERE, "chat_bridge.py"), "--home", self.home, "--page-dir", self.pages, "--port", str(port)] + list(extra_args),
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env={"PATH": "/usr/bin:/bin", "HOME": self.tmp})
        self.addCleanup(lambda: p.poll() is None and p.kill())
        return p, port

    def test_extra_dir_name_equals_folder_is_served_and_printed(self):
        p, port = self.run_bridge("--extra-dir", "how-it-works=" + self.extra)
        up = lambda: socket.socket().connect_ex(("127.0.0.1", port)) == 0
        self.assertTrue(wait_for(up, 8))
        import http.client
        c = http.client.HTTPConnection("127.0.0.1", port)
        c.request("GET", "/how-it-works/")
        r = c.getresponse()
        self.assertEqual((r.status, r.read()), (200, b"how it works"))
        p.terminate()
        out, err = p.communicate(timeout=10)
        self.assertIn("/how-it-works/", out)
        self.assertNotIn(KEY, out + err)

    def test_a_bad_spec_or_an_extra_folder_inside_the_home_exits_with_a_message(self):
        os.makedirs(os.path.join(self.home, "www"))
        for spec in ("how-it-works", "how-it-works=", "=" + self.extra, "chat=" + self.extra, "how-it-works=" + os.path.join(self.home, "www")):
            with self.subTest(spec=spec):
                p, _ = self.run_bridge("--extra-dir", spec)
                out, err = p.communicate(timeout=10)
                self.assertNotEqual(p.returncode, 0)
                self.assertTrue(err.strip() or out.strip())


if __name__ == "__main__":
    unittest.main()
