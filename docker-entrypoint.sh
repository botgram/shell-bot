#!/usr/bin/env bash
set -euf -o pipefail
sed 's/123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/'$AUTH_TOKEN'/; s/34509246/'$OWNER'/' config.example.json > config.json
exec $@
