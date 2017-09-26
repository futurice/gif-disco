using System.IO;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class Config {
	public string serverUrl;
}

public class Configuration {

	private static Configuration instance;
	private static object _lock = new object();
	private Config config;

	public string ServerUrl { get { return config.serverUrl; } }

	public static Configuration Instance {
		get {
			lock (_lock) {
				if (instance == null) {
					instance = new Configuration ();
					string configFilePath = "/storage/emulated/0/Movies/config.json";
					#if UNITY_EDITOR
					configFilePath= "/Users/kilp/devel/config.json";
					#endif
					LoadConfiguration (instance, configFilePath);
				}
				return instance;
			}
		}
	}

	static void LoadConfiguration(Configuration instance, string path) {
		try {
			string json = File.ReadAllText(path);
			instance.config = JsonUtility.FromJson<Config>(json);
		} catch (IOException ex) {
			Debug.LogError (ex);
			// error loading config.. default to dev
			instance.config = new Config();
		}
	}

}
