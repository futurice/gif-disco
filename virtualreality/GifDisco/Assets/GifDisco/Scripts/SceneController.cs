using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UniRx;

public class SceneController : MonoBehaviour {

	[SerializeField]
	GameObject dancerPrefab;

	int maxDancers = 100;

	int nDancers = 0;
	List<Dancer> dancers = new List<Dancer>();

	static float goldenRatio = 1.61803398875f;
	float theta = 2 * Mathf.PI * (1 - 1 / goldenRatio);

	float time = 0f;
	float interval = 10.0f; // frequency to poll and add new dancers

	System.IDisposable disposable; // server request, disposable

	void Start () {

		/*
		for (int i = 0; i < 50; i++) {
			AddDancer ();
		}
		*/

		int j=4; // position for next before new
		foreach (Dancer dancer in dancers) {
			// calculate new position for dancer
			dancer.MoveToPos (GetAngle(j),GetRadius(j));
			dancer.SetPosition(GetAngle(j),GetRadius(j));
			j++;
		}
	}

	void AddDancer(Atlas atlas) {
		// new position should be zero, move other dancers (lerp?)
		int i=5; // position for next before new
		foreach (Dancer dancer in dancers) {
			// calculate new position for dancer
			dancer.MoveToPos (GetAngle(i),GetRadius(i));
			i++;
		}
		// instantiate new dancer in position of "last"
		GameObject dancerObject = GameObject.Instantiate (dancerPrefab, Vector3.zero, Quaternion.Euler (Vector3.zero));
		Dancer dancerScript = dancerObject.GetComponentInChildren<Dancer> ();
		float angle =  GetAngle(4);
		float radius = GetRadius(4);
		dancerScript.SetPosition (angle, radius);
		dancerScript.MoveToPos (angle, radius);
		//int idx = ((nDancers) % 8) + 1;
		//dancerScript.SetDancerID ("00" + idx + ".png");
		dancerScript.SetAndFetchAtlas (atlas);
		dancers.Insert (0, dancerScript);
		nDancers += 1;
	}

	void Awake() {
		FetchAndAddFromServer ();
	}

	void FetchAndAddFromServer() {
		string url = Configuration.Instance.ServerUrl + "/atlas";
		disposable = RestClient.Instance.FetchDancers (url)
			.Subscribe (x => AddAllFrom (x), ex=>Error(ex));
	}

	void AddAllFrom(List<Atlas> atlasList) {
		List<Dancer> toRemove = new List<Dancer> ();
		List<Atlas> toAdd = new List<Atlas> ();

		foreach (Dancer dancer in dancers) {
			bool found = false;
			foreach (Atlas atlas in atlasList) {
				if (atlas.id == dancer.atlas.id) {
					found = true;
				}
			}
			if (!found) {
				toRemove.Add (dancer);
			}
		}

		foreach (Atlas atlas in atlasList) {
			bool found = false;
			foreach (Dancer dancer in dancers) {
				if (atlas.id == dancer.atlas.id) {
					found = true;
				}
			}
			if (!found) {
				toAdd.Add (atlas);
			}
		}

		foreach (Dancer dancer in toRemove) {
			dancer.Remove ();
		}

		foreach (Atlas atlas in toAdd) {
			AddDancer (atlas);
		}

	}

	void Error(System.Exception error) {
		Debug.LogError (error);
	}

	private float GetAngle(int i) {
		return i * theta * Mathf.Rad2Deg;
	}

	private float GetRadius(int i) {
		return Mathf.Sqrt (i);
	}
				
	void Update() {
		time += Time.deltaTime;
		if (time > interval) {
			disposable.Dispose ();
			time = 0f;
			FetchAndAddFromServer ();
		}
	}

}
