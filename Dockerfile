# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src/ ./src/
COPY --from=prerelease /usr/src/app/package.json .

# ensure runtime data directories exist and are owned by bun user
RUN mkdir -p .db .data && chown -R bun:bun .db .data

# copy entrypoint and make it executable
COPY docker-entrypoint.sh ./
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# run the app via entrypoint
USER bun
EXPOSE 8778/tcp
ENTRYPOINT [ "/usr/src/app/docker-entrypoint.sh" ]
