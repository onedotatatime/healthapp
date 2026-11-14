"""chat_service.sh install with --extra-dir (MIN-4497, CTO S1). Runs the real script with a fake HOME and fake `launchctl` and `lsof` on PATH, so
nothing is loaded and no listener or LaunchAgent of the machine is touched. /bin/bash is the Mac's bash 3.2: an empty array under `set -u` is the trap."""
import os
import plistlib
import subprocess
import tempfile
import unittest

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(HERE, "chat_service.sh")


class ChatServiceInstall(unittest.TestCase):
    def setUp(self):
        self.tmp = os.path.realpath(tempfile.mkdtemp(prefix="chatsvc-"))
        self.addCleanup(os.system, "rm -rf %s" % self.tmp)
        j = lambda *p: os.path.join(self.tmp, *p)
        for d in ("bin", "home", "pages", "www/how-it-works", "www/other", "dash"):
            os.makedirs(j(*d.split("/")))
        for name, body in (("launchctl", '#!/bin/sh\necho "$@" >> "%s"\nexit 0\n' % j("launchctl.log")), ("lsof", "#!/bin/sh\nexit 1\n")):
            with open(j("bin", name), "w") as f:
                f.write(body)
            os.chmod(j("bin", name), 0o755)
        self.env = {"PATH": "%s:/usr/bin:/bin" % j("bin"), "HOME": j("home"), "HEALTHAPP_DASHBOARD_HOME": j("dash")}
        self.pages, self.hiw, self.other = j("pages"), j("www", "how-it-works"), j("www", "other")

    def run_install(self, *args):
        return subprocess.run(["/bin/bash", SCRIPT, "install", "--page-dir", self.pages, "--port", "9999"] + list(args), env=self.env, capture_output=True, text=True,
                              timeout=60)

    def plist(self):
        with open(os.path.join(self.tmp, "home", "Library", "LaunchAgents", "ai.minhos.healthapp-dashboard-chat.plist"), "rb") as f:
            return plistlib.load(f)["ProgramArguments"]

    def test_install_without_an_extra_dir_still_works_on_bash_3_2(self):
        r = self.run_install()
        self.assertEqual(r.returncode, 0, r.stderr)
        args = self.plist()
        self.assertNotIn("--extra-dir", args)
        self.assertEqual(args[args.index("--page-dir") + 1], self.pages)
        self.assertEqual(args[args.index("--port") + 1], "9999")
        self.assertIn("bootstrap", open(os.path.join(self.tmp, "launchctl.log")).read())          # the fake launchctl was the one called

    def test_extra_dirs_go_into_the_plist_as_name_equals_real_path(self):
        r = self.run_install("--extra-dir", "how-it-works=" + self.hiw, "--extra-dir", "other=" + self.other)
        self.assertEqual(r.returncode, 0, r.stderr)
        args = self.plist()
        pairs = [args[i + 1] for i, a in enumerate(args) if a == "--extra-dir"]
        self.assertEqual(pairs, ["how-it-works=" + self.hiw, "other=" + self.other])
        self.assertEqual(args[args.index("--port") + 1], "9999")                                  # the port stays after them
        self.assertIn("/how-it-works/ -> " + self.hiw, r.stdout)
        self.assertNotRegex(r.stdout + r.stderr, r"[0-9a-f]{64}")                                  # no key is printed

    def test_a_symlinked_extra_folder_is_stored_by_its_real_path(self):
        link = os.path.join(self.tmp, "link")
        os.symlink(self.hiw, link)
        self.assertEqual(self.run_install("--extra-dir", "how-it-works=" + link).returncode, 0)
        self.assertIn("how-it-works=" + self.hiw, self.plist())

    def test_bad_specs_are_refused_before_anything_is_written(self):
        for spec in ("how-it-works", "how-it-works=", "=" + self.hiw, "How=" + self.hiw, "-x=" + self.hiw, "a b=" + self.hiw, "x=" + self.tmp + "/no-such"):
            with self.subTest(spec=spec):
                r = self.run_install("--extra-dir", spec)
                self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                self.assertFalse(os.path.exists(os.path.join(self.tmp, "home", "Library")))
        r = subprocess.run(["/bin/bash", SCRIPT, "install", "--extra-dir"], env=self.env, capture_output=True, text=True, timeout=60)
        self.assertNotEqual(r.returncode, 0)

    def test_the_script_is_valid_shell_and_has_no_array_expansion_bash_3_2_chokes_on(self):
        self.assertEqual(subprocess.run(["/bin/bash", "-n", SCRIPT]).returncode, 0)
        code = "\n".join(l for l in open(SCRIPT).read().splitlines() if not l.lstrip().startswith("#"))
        self.assertNotIn("[@]}", code)


if __name__ == "__main__":
    unittest.main()
