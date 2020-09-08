# Dynatrace Drone Events

[![Build Status](https://drone.sablecliff.com/api/badges/mzball-dt/dynatrace-drone-events/status.svg)](https://drone.sablecliff.com/mzball-dt/dynatrace-drone-events)

A Drone CI Plugin for pushing deployment events to tagged entities for greater visibility, automation and problem investigation.

This repo is consumed by a local instance of Drone and the resulting docker container pushed to [cavejay/dynatrace-drone-events](https://hub.docker.com/repository/docker/cavejay/dynatrace-drone-events/general)

## Usage

Integrate this in your Drone pipeline like so:

```yaml

```

This Deno script can be run by itself, but much of the interesting information is passed to the script via environment variables established by Drone at run time.

```shell
insert shell snippet
```

Tie build events from Drone CI to your monitored entities in Dynatrace.

## Development

1. Install Deno from https://deno.land
2. Clone this repo
3. Deno run --allow-net --allow-env ./main.ts
4. Deno run --allow-read ./tests.ts

