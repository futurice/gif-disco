using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UniRx;

public static class AtlasJsonHelper
{
	public static T[] FromJson<T>(string json)
	{
		Wrapper<T> wrapper = JsonUtility.FromJson<Wrapper<T>>(json);
		return wrapper.visible;
	}

	[System.Serializable]
	private class Wrapper<T>
	{
		public T[] visible;
	}
}

/*

	{
		'id': atlas['id'],
		'height': gif['height'],
		'added': int(time.time())
	}

*/

[System.Serializable]
public class Atlas {
	public string id;
	public string height;
	public string added;
}

public class RestClient {

	private static RestClient instance;
	private static object _lock = new object();

	public static RestClient Instance {
		get {
			lock (_lock) {
				if (instance == null) {
					instance = new RestClient ();
				}
				return instance;
			}
		}
	}

	public IObservable<List<Atlas>> FetchDancers(string serverUrl) {
		return ObservableWWW.Get (serverUrl).
			Select (json => {
				Atlas[] atlases = AtlasJsonHelper.FromJson<Atlas>(json);
				return atlases.ToList();
			});
	}

	public IObservable<byte[]> FetchAtlas(string url) {
		return ObservableWWW.GetAndGetBytes (url);
	}

}
