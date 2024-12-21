# Syncflow Sharer

This is a demo application that allows you to share different media to a SyncFlow project. This project will be handy for systems in which direct integrations with SyncFlow and your system isn't possible.

## Deployment Instructions

First, Create an environment file (`secrets.ts`) with the following content:

```{sh}
SYNCFLOW_SERVER_URL="SYNCFLOW_BACKEND_URL"
SYNCFLOW_API_KEY="YOUR API KEY"
SYNCFLOW_API_SECRET="YOUR API SECRET"
SYNCFLOW_PROJECT_ID="YOUR PROJECT ID"
ROOT_USER="DESIRED ROOT USER NAME"
ROOT_PASSWORD="DESIRED PASSWORD's HASH"
```

Use the docker commands, to build and run the app.

```{sh}
$ docker compose build
$ docker compose up
```

## License

[Apache 2.0](./LICENSE)

## Funding Information

This work is supported by the National Science Foundation under Grant No. DRL-2112635.
