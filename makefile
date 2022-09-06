uncommitted = $(shell git update-index --refresh)
beckett_marketplace_head = $(shell git rev-parse HEAD | cut -c 1-8)
beckett_marketplace_branch = $(shell git rev-parse --abbrev-ref HEAD)
timestamp = $(shell date '+%Y%m%d')

docker:
ifeq ($(uncommitted),)
	cd marketplace && npm run build
	docker build -t marketplace-api:$(beckett_marketplace_branch)-$(timestamp)-$(beckett_marketplace_head) -f docker/marketplace.api.dockerfile .
else
	@echo "Uncommitted changes detected: $(uncommitted)"
	exit 1
endif

clean:
	rm -rf marketplace/node_modules
	rm -rf marketplace/package-lock.json
	rm -rf marketplace/dist

install:
	cd marketplace && npm ci;

run:
	cd marketplace && npm run start;

.PHONY: docker install run
