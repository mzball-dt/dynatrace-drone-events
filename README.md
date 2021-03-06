# Dynatrace Drone Events

[![Build Status](https://drone.sablecliff.com/api/badges/mzball-dt/dynatrace-drone-events/status.svg)](https://drone.sablecliff.com/mzball-dt/dynatrace-drone-events)

A Drone CI Plugin for pushing deployment events to tagged entities for greater visibility, automation and problem investigation.

This repo is consumed by a local instance of Drone and the resulting docker container pushed to [cavejay/dynatrace-drone-events](https://hub.docker.com/repository/docker/cavejay/dynatrace-drone-events/general) for use as a Drone CI plugin.

## Usage

Integrate this into your Drone pipeline like so:

```yaml
- name: Inform Dynatrace of Deployment
    image: cavejay/dynatrace-drone-events
    settings:
      dynatrace_environment:
        from_secret: dtenv
      dynatrace_api_token:
        from_secret: dttoken
      tagrules:
        - HOST=tag1
        - SERVICE=tag2&&tag3
```

For a result like:

![Resulting Dynatrace Event](https://github.com/mzball-dt/dynatrace-drone-events/blob/master/dtEventExample.jpg?raw=true)

This Deno script can be run by itself, but much of the interesting information is passed to the script via environment variables established by Drone at runtime.
main.ts can be inspected for the DRONE environment variables that are used.

```powershell
pwsh ~\dynatrace-drone-events>$env:PLUGIN_DYNATRACE_ENVIRONMENT = 'https://abc1234.live.dynatrace.com'
pwsh ~\dynatrace-drone-events>$env:PLUGIN_DYNATRACE_API_TOKEN = '7h1515470k3npl3453b3l13v3'
pwsh ~\dynatrace-drone-events>$env:PLUGIN_TAGRULES = 'HOST=tag1,SERVICE=tag2&&tag3'
pwsh ~\dynatrace-drone-events>deno run --allow-env --allow-net .\main.ts
```

## Development

1. Install Deno from https://deno.land
2. Clone this repo

`git clone https://github.com/mzball-dt/dynatrace-drone-events`

3. Make changes
4. Run tests

`deno test`

4. Populate the environment variables and then run the script

`deno run --allow-net --allow-env ./main.ts`
