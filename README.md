# blue-translate

## Initialize the database

Before this will create translation files, you need the table crated in dynamodb.

Go to the root folder, and run this command:
```
node db_init.js
```

## Set up the translation service

Ask Sam to add you IP address to the whitelisted IP addresses for this service's API key.


Get a copy of this file from one of the developers, and put it in your home user folder.
```
blue-translate-9593cbd552e0.json
```

Add an environment variable, pointing to that credentials file location.
```
GOOGLE_APPLICATION_CREDENTIALS
C:\Users\styso\blue-translate-9593cbd552e0.json
```

## Translate your file(s)

In `readAndTranslate.js`, set the path to your English localization files:
```
const inputFolder = 'C:\\projects\\blue\\agent\\source\\i18n\\Data\\en\\';
```

In `readAndTranslate.js`, add the file(s) to be translated:
```
const inputFiles = ['2023.5.EmployeeImporter.en.csv'];
```

If there is a `results` folder in this project from a previous translation, remove it.

Go to the root folder, and run this command:
```
node readAndTranslate.js
```

The results folder in this project should be created, and it should have a corresponding sub-folder and file for each of the target languages.


## Apply the results to Agent

Copy all of these folders to the `Agent\source\i18n\data` folder in blue.


Run this command from the Agent root folder to re-generate the localization files:
```
rake loc:generate_shared loc:generate_shared_frontend restart
```

## Verify the results in Agent

Open the Agent app and verify the new translations appear for all of the target languages.
