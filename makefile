docker:
	cd marketplace && npm run build
	docker build -t marketplace-api:1.0.0 -f docker/marketplace.api.dockerfile .

clean:
	rm -rf marketplace/node_modules
	rm -rf marketplace/package-lock.json
	rm -rf marketplace/dist

install:
	cd marketplace && npm install;

run:
	cd marketplace && npm run start;

.PHONY: docker install run
