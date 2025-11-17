-include .env

VERSION := $(shell cat VERSION)
PUBLISHEDIMAGE := $(shell cat PUBLISHED)

build-base:
	docker build -f Dockerfile.base --build-arg "NPM_TOKEN=${NPM_TOKEN}" --build-arg "DATASET_CONFIG_URL=${VITE_DATASET_CONFIG_URL}" --build-arg "ENVIRONMENT"=${VITE_ENVIRONMENT} -t informatievlaanderen/codelijsten-base:${VERSION} .

build-base-linux:
	docker build -f Dockerfile.base --build-arg "NPM_TOKEN=${NPM_TOKEN}" --build-arg "DATASET_CONFIG_URL=${VITE_DATASET_CONFIG_URL}" --build-arg "ENVIRONMENT"=${VITE_ENVIRONMENT}  --platform=linux/amd64 -t informatievlaanderen/codelijsten-base:${VERSION} .

# first build-base should have been run
build:
	docker build -f Dockerfile.build --build-arg "VERSION=${VERSION}" -t informatievlaanderen/codelijsten:${VERSION} .

# first build-base-linux should have been run
build-linux:
	docker build -f Dockerfile.build --platform=linux/amd64 --build-arg "VERSION=${VERSION}" -t informatievlaanderen/codelijsten:${VERSION} .

exec:
	docker run -it --rm --name codelijsten -p 3000:3000 informatievlaanderen/codelijsten:${VERSION} sh

run:
	docker run -d --rm --name codelijsten -p 3000:3000 informatievlaanderen/codelijsten:${VERSION}

stop:
	docker stop codelijsten

publish:
	docker tag informatievlaanderen/codelijsten:${VERSION} ${PUBLISHEDIMAGE}:${VERSION}
	docker push ${PUBLISHEDIMAGE}:${VERSION}

