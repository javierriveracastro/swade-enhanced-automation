# Swade enhanced automation

This is a experimental module trying to add new automation options to Foundry SWADE system while working with the default behaviour. Instead of rewriting the built-in automation it tries to improve upon it, keeping system UI as untouched as possible.

## Features

* Gang-up: It adds basic gangup resolution to the system modifiers. It is based in BR2 gangup calculation, so it should be quite robust and tested. It doesn't support all the BR features, the most important missing ones are support for Formation Figther and Block edge, and the ability to configure the distance at with a token is considered to be in melee. The second one is quite important for gridless play, it will assume 1.2 units.