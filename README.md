# Forge 

Sprint report issues macros will show data from your Jira project on the Confluence page. It will show a Sprint Report where all your Sprint backlog items are divided into different sections, and you will easily see completed Items, uncompleted and Items added after the Sprint has started. 

With the help of this report you can continually analyze the effectiveness of your planning, and it will help you to improve predictability and align Completed and Planned velocity.


## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start

- Modify your app by editing the `src/index.jsx` file.

- Build and deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

- Develop your app by running `forge tunnel` to proxy invocations locally:
```
forge tunnel
```

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
