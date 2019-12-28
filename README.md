# Your Plugin Name

Add your plugin badges here. See [nativescript-urlhandler](https://github.com/hypery2k/nativescript-urlhandler) for example.

Then describe what's the purpose of your plugin. 

In case you develop UI plugin, this is where you can add some screenshots.

## (Optional) Prerequisites / Requirements

Describe the prerequisites that the user need to have installed before using your plugin. See [nativescript-firebase plugin](https://github.com/eddyverbruggen/nativescript-plugin-firebase) for example.

## Installation

Describe your plugin installation steps. Ideally it would be something like:

```javascript
tns plugin add <your-plugin-name>
```

## Usage 

Describe any usage specifics for your plugin. Give examples for Android, iOS, Angular if needed. See [nativescript-drop-down](https://www.npmjs.com/package/nativescript-drop-down) for example.
	
	```javascript
    Usage code snippets here
    ```)

### Android 
o do this in Android 9 Pie you will have to set a networkSecurityConfig in your Manifest application tag like this:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest ... >
    <application android:networkSecurityConfig="@xml/network_security_config">
    </application>
</manifest>
```
Then in your xml folder you now have to create a file named network_security_config just like the way you have named it in the Manifest and from there the content of your file should be like this to enable all requests without encryptions:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```
From there you are good to go. Now your app will make requests for all types of connections. For additional information read here.

## Generate typings

### Android
```

### iOS

## API

Describe your plugin methods and properties here. See [nativescript-feedback](https://github.com/EddyVerbruggen/nativescript-feedback) for example.
    
| Property | Default | Description |
| --- | --- | --- |
| some property | property default value | property description, default values, etc.. |
| another property | property default value | property description, default values, etc.. |
    
## License

Apache License Version 2.0, January 2004
