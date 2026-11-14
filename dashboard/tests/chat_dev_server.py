"""Dev harness for the dashboard chat page (MIN-4498): the REAL bridge (chat_bridge.py) on 127.0.0.1 with the stub `claude` from the
test kit, serving the real page folder. No model is called; nothing outside this machine is reached. For looking at the page by hand.

    python3 dashboard/tests/chat_dev_server.py [--port 8769] [--key <throw-away key, 32+ chars>] [--act]

It prints the port and the stub folder. Change what the stub answers by writing <stub folder>/behavior.json, for example
    {"reply": "Ask me anything.", "events": [{"name": "Read", "input": {"file_path": "dashboard/snapshot.py"}}], "sleep": 8}
A reply that ends with a <<<PROPOSAL {json} PROPOSAL>>> block makes a proposal card. The key is never printed. The page needs it once, as
`#c=<key>` on the URL. Use a throw-away key here, never ~/.healthapp-dashboard/chat.key.
"""
import argparse
import os
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))
import chat_bridge as B  # noqa: E402
import chat_testkit as T  # noqa: E402

PAGES = os.path.join(os.path.dirname(os.path.dirname(HERE)), "docs", "dashboard", "drafts")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8769)
    ap.add_argument("--key", default="devkey" + "x" * 34)
    ap.add_argument("--pages", default=PAGES)
    ap.add_argument("--act", action="store_true", help="set config.chat.act true (the bridge still answers act_off until the act turn is built)")
    args = ap.parse_args()
    tmp = os.path.realpath(tempfile.mkdtemp(prefix="chatdev-"))
    for d in ("home", "healthapp/src", "conductor/docs", "stub"):
        os.makedirs(os.path.join(tmp, d))
    stub = os.path.join(tmp, "stub", "claude")
    with open(stub, "w") as f:
        f.write(T.STUB % {"python": sys.executable, "dir": os.path.join(tmp, "stub")})
    os.chmod(stub, 0o755)
    settings = dict(B.DEFAULTS)
    settings.update({"cwd": os.path.join(tmp, "healthapp"), "conductorDir": os.path.join(tmp, "conductor"), "claudeBin": stub, "act": bool(args.act)})
    names = [("Back", "Product", "product-minhos"), ("Anna", "Marketing", "marketing-minhos"), ("Pix", "Design", "design-minhos"), ("Ren", "Frontend", "frontend-minhos"),
             ("Cron", "Backend", "backend-minhos"), ("CTO", "CTO", "cto-minhos"), ("Spast", "Sales", "sales-minhos"), ("Release", "Release", "release-minhos"),
             ("CEO", "CEO", "ceo-minhos"), ("E2E", "E2E", "e2e-minhos")]
    agents = [{"n": n, "role": r, "agentType": f} for n, r, f in names]
    srv = B.make_server(os.path.join(tmp, "home"), args.pages, args.port, settings, agents, key=args.key, row_checker=T.fake_rows)
    print("dev bridge on 127.0.0.1:%d, stub folder %s" % (srv.port, os.path.join(tmp, "stub")), flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.chat.shutdown()
        srv.server_close()


if __name__ == "__main__":
    main()
