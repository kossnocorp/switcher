.DEFAULT_GOAL := build
.PHONY: build

BIN = $(shell yarn bin)

test:
	${BIN}/karma start --single-run
.PHONY: test

test-watch:
	${BIN}/karma start

build:
	@rm -rf lib
	@${BIN}/tsc
	@${BIN}/prettier "lib/**/*.[jt]s" --write --loglevel silent
	@cp {package.json,*.md} lib/react
	@rsync --archive --prune-empty-dirs --exclude '*.ts' --relative src/./ lib/react
	@cp -r lib/react lib/preact
	@${BIN}/ts-node scripts/patchReact.ts
	@${BIN}/ts-node scripts/patchPreact.ts

publish: build
	cd lib/react && npm publish --access public
	cd lib/preact && npm publish --access public

publish-next: build
	cd lib && npm publish --access public --tag next

docs:
	@${BIN}/typedoc --theme minimal --name Switcher
.PHONY: docs