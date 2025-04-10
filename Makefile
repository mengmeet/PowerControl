ifneq (,$(wildcard ./.env))
	include .env
	export
endif

SHELL=bash

help: ## Display list of tasks with descriptions
	@echo "+ $@"
	@fgrep -h ": ## " $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed 's/-default//' | awk 'BEGIN {FS = ": ## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

vendor: ## Install project dependencies
	@echo "+ $@"
	@pnpm i

env: ## Create default .env file
	@echo "+ $@"
	@echo -e '# Makefile tools\nDECK_USER=deck\nDECK_HOST=\nDECK_PORT=22\nDECK_HOME=/home/deck\nDECK_KEY=~/.ssh/id_rsa' >> .env
	@echo -n "PLUGIN_FOLDER=" >> .env
	@jq -r .name package.json >> .env

init: ## Initialize project
	@$(MAKE) env
	@$(MAKE) vendor
	@echo -e "\n\033[1;36m Almost ready! Just a few things left to do:\033[0m\n"
	@echo -e "1. Open .env file and make sure every DECK_* variable matches your steamdeck's ip/host, user, etc"
	@echo -e "2. Run \`\033[0;36mmake copy-ssh-key\033[0m\` to copy your public ssh key to steamdeck"
	@echo -e "3. Build your code with \`\033[0;36mmake build\033[0m\` or \`\033[0;36mmake docker-build\033[0m\` to build inside a docker container"
	@echo -e "4. Deploy your plugin code to steamdeck with \`\033[0;36mmake deploy\033[0m\`"

update-frontend-lib: ## Update decky-frontend-lib
	@echo "+ $@"
	@pnpm update decky-frontend-lib --latest

update-ui: ## Update @decky/api and @decky/ui
	@echo "+ $@"
	@pnpm update @decky/api @decky/ui react-icons --latest


update-decky-ui: ## Update @decky/ui @decky/api
	@echo "+ $@"
	@pnpm update @decky/ui --latest
	@pnpm update @decky/api --latest

build-front: ## Build frontend
	@echo "+ $@"
	@pnpm run build

build-back: ## Build backend
	@echo "+ $@"
	@make -C ./backend

build: ## Build everything
	@$(MAKE) build-front build-back

copy-ssh-key: ## Copy public ssh key to steamdeck
	@echo "+ $@"
	@ssh-copy-id -i $(DECK_KEY) $(DECK_USER)@$(DECK_HOST)

deploy-steamdeck: ## Deploy plugin build to steamdeck
	@echo "+ $@"
	@ssh $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
 		'chmod -v 755 $(DECK_HOME)/homebrew/plugins/ && mkdir -p $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)'
	@rsync -azp --delete --progress -e "ssh -p $(DECK_PORT) -i $(DECK_KEY)" \
		--chmod=Du=rwx,Dg=rx,Do=rx,Fu=rwx,Fg=rx,Fo=rx \
		--exclude='.git/' \
		--exclude='*.pyc' \
		--exclude='.github/' \
		--exclude='.vscode/' \
		--exclude='node_modules/' \
		--exclude='.pnpm-store/' \
		--exclude='src/' \
		--exclude='*.log' \
		--exclude='.gitignore' . \
		--exclude='.idea' . \
		--exclude='.env' . \
		--exclude='Makefile' . \
		--exclude='submodule' . \
		--exclude='__pycache__' . \
 		./ $(DECK_USER)@$(DECK_HOST):$(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)/
	@ssh $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
 		'chmod -v 755 $(DECK_HOME)/homebrew/plugins/'

local-fuse: ## Copy fuse module to local site-packages
	@echo "+ $@"
	@mkdir -p ./py_modules/site-packages
	@rm -rf ./py_modules/site-packages/fuse* ./py_modules/site-packages/fuseparts
	@rm -rf ./submodule/python-fuse/build
	@cd ./submodule/python-fuse && \
		PYTHONPATH=$(PWD)/py_modules/site-packages \
		python3 setup.py install --prefix=dist/install --install-lib=dist/install && \
		rsync -a --exclude=*.pyc --exclude=__pycache__ ./dist/install/fuse*/fuse* $(PWD)/py_modules/site-packages/ 
	@rm -rf $(PWD)/submodule/python-fuse/build


restart-decky: ## Restart Decky on remote steamdeck
	@echo "+ $@"
	@ssh -t $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
 		'sudo systemctl restart plugin_loader.service'
	@echo -e '\033[0;32m+ all is good, restarting Decky...\033[0m'

deploy: ## Deploy code to steamdeck and restart Decky
	@$(MAKE) deploy-steamdeck
	@$(MAKE) restart-decky

deploy-only: ## Deploy code to steamdeck
	@$(MAKE) deploy-steamdeck
	@$(MAKE) set-loglevel

deploy-release: ## Deploy release to steamdeck and restart Decky
	@$(MAKE) deploy-steamdeck
	@$(MAKE) set-loglevel
	@$(MAKE) restart-decky

set-loglevel: ## Set log level to info
	@echo "+ $@"
	@ssh -t $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
		'chmod -v 755 $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)/py_modules'
	@ssh -t $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
 		"sed -i 's/logging.DEBUG/logging.INFO/' $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)/py_modules/config.py"

it: ## Build all code, deploy it to steamdeck, restart Decky
	@$(MAKE) build deploy

cleanup: ## Delete all generated files and folders
	@echo "+ $@"
	@rm -f .env
	@rm -rf ./dist
	@rm -rf ./tmp
	@rm -rf ./node_modules
	@rm -rf ./.pnpm-store
	@rm -rf ./backend/out

uninstall-plugin: ## Uninstall plugin from steamdeck, restart Decky
	@echo "+ $@"
	@ssh -t $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
 		"sudo sh -c 'rm -rf $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)/ && systemctl restart plugin_loader.service'"
	@echo -e '\033[0;32m+ all is good, restarting Decky...\033[0m'

docker-rebuild-image: ## Rebuild docker image
	@echo "+ $@"
	@docker compose build --pull

docker-build: ## Build project inside docker container
	@$(MAKE) build-back
	@echo "+ $@"
	@docker run --rm -i -v $(PWD):/plugin -v $(PWD)/tmp/out:/out ghcr.io/steamdeckhomebrew/builder:latest