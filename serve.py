#!/usr/bin/env python3

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Serve os arquivos do desafio.")
    parser.add_argument("port", nargs="?", type=int, default=8000)
    return parser.parse_args()


def main():
    args = parse_args()
    project_dir = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=project_dir)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)

    print(f"Servidor disponível em http://localhost:{args.port}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
