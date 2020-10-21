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
	@${BIN}/tsc --outDir lib/react
	@cp package.json lib/react
	@cp *.md lib/react
	@rsync --archive --prune-empty-dirs --exclude '*.ts' --relative src/./ lib/react
	@${BIN}/ts-node scripts/patchReact.ts
	@${BIN}/ts-node scripts/switchAdaptor.ts preact
	@${BIN}/tsc --outDir lib/preact
	@cp package.json lib/preact
	@cp *.md lib/preact
	@rsync --archive --prune-empty-dirs --exclude '*.ts' --relative src/./ lib/preact
	@${BIN}/ts-node scripts/patchPreact.ts
	@${BIN}/ts-node scripts/switchAdaptor.ts react

publish: build
	cd lib/react && npm publish --access public
	cd lib/preact && npm publish --access public

publish-next: build
	cd lib/react && npm publish --access public --tag next
	cd lib/preact && npm publish --access public --tag next

docs:
	@${BIN}/typedoc --theme minimal --name Switcher
.PHONY: docs