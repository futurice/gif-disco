using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UniRx;
using System.IO;

public class Dancer : MonoBehaviour {

	public Atlas atlas;

	Material dancerMaterial;
	Transform mainCameraTransform;

	int frames = 18;
	int frameOffset = 0;

	bool loaded = false;
	float fps = 15;
	string id;

	int tilesX = 5;
	int tilesY = 4;
	Vector2 size;

	float currentAngle;
	float currentRadius;
	float targetAngle;
	float targetRadius;

	float floorSize = 0.8f;

	[SerializeField]
	float movementSpeed = 0.1f;

	// Use this for initialization
	void Start () {
		mainCameraTransform = Camera.main.transform;
		dancerMaterial = GetComponent<Renderer> ().material;
		Mesh mesh = GetComponent<MeshFilter>().mesh;

		if (!string.IsNullOrEmpty (id)) {
			LoadAtlas ();
		}
	}

	public void SetDancerID(string dancerId) {
		id = dancerId;
	}

	public void MoveToPos(float angle,float radius) {
		targetAngle = angle;
		targetRadius = radius;
	}

	public void SetAndFetchAtlas(Atlas atlas) {
		this.atlas = atlas;
		RestClient.Instance.FetchAtlas (Configuration.Instance.ServerUrl + "/static/img/atlas/" + atlas.id + ".png")
			.Subscribe (x => LoadFromBytes (x),
						ex => Error (ex));
	}

	void LoadFromBytes(byte[] bytes) {
		Texture2D tex = null;
		//Debug.LogWarning ("Trying to load image from " + filePath);
		tex = new Texture2D(2, 2);
		tex.LoadImage(bytes); //..this will auto-resize the texture dimensions.
		LoadSuccess(tex);
	}

	void Error(System.Exception ex) {
		Debug.LogError (ex);
		Remove ();
	}

	public void SetPosition(float angle, float radius) {
		Vector2 newPos = PolarCoordinate (angle,radius)*floorSize;
		currentAngle = angle;
		currentRadius = radius;
		Vector3 pos = new Vector3(
			newPos.x,
			1.0f,
			newPos.y
		);
		transform.position = pos;
	}

	Vector2 PolarCoordinate(float angle, float radius) {
		float rad = Mathf.Deg2Rad * angle;
		return new Vector2 (Mathf.Cos (rad), Mathf.Sin (rad)) * radius;
	}

	public void Remove () {
		Object.Destroy (this.gameObject);
	}

	public void LoadAtlas() {
/*
		string path;
		#if UNITY_EDITOR
		path = Application.streamingAssetsPath + "/" + name;
		#endif
		#if UNITY_ANDROID
		path = "jar:file://" + Application.dataPath + "!/assets" + name;
		#endif
		path = "jar:file://" + Application.dataPath + "!/assets" + name;
		byte[] fileData;
		fileData = File.ReadAllBytes(path);
		LoadSuccess (fileData);
		ObservableWWW.GetAndGetBytes (path).Subscribe (
			x => LoadSuccess (x)
		);
*/
		StartCoroutine (LoadTexture());
	}

	IEnumerator LoadTexture()
	{
		string path;
		#if UNITY_ANDROID
		path = "jar:file://" + Application.dataPath + "!/assets/" + id;
		#endif
		#if UNITY_EDITOR
		path = "file://" + Application.streamingAssetsPath + "/" + id;
		#endif
		// TODO: actually from server and using UniRx!
		WWW linkstream = new WWW(path);
		yield return linkstream;
		LoadSuccess (linkstream.texture);
	} 

	void LoadSuccess(Texture2D texture) {
		dancerMaterial.mainTexture = texture;
		SetFrame (0);
		size = new Vector2 ((1.0f / tilesX), (1.0f / tilesY));
		dancerMaterial.SetTextureScale ("_MainTex", size);
		loaded = true;
		frameOffset = Random.Range (0, frames);
	}

/*	void LoadSuccess(byte[] bytes) {
		Texture2D atlas = new Texture2D (2, 2);
		atlas.LoadImage (bytes);
		Debug.Log ("Size : " + atlas.width + "x" + atlas.height);
		dancerMaterial.mainTexture = atlas;
		SetFrame (0);
		size = new Vector2 ((1.0f / tilesX), (1.0f / tilesY));
		dancerMaterial.SetTextureScale ("_MainTex", size);
		loaded = true;
	}
*/
	void SetFrame(int index) {
		var uIndex = index % tilesX;
		var vIndex = index / tilesX;

		// build offset
		// v coordinate is the bottom of the image in opengl so we need to invert.
		Vector2 offset = new Vector2 ((uIndex * size.x), (1.0f - size.y - vIndex * size.y));
		dancerMaterial.SetTextureOffset ("_MainTex", offset);
	}

	// Update is called once per frame
	void Update () {
		int frameIndex = Mathf.Abs((((int)(Time.time * fps)+frameOffset) % (frames*2-1))-(frames-1));
		// once we have loaded a texture atlas, let's animate ourselfs
		if (loaded) {
			SetFrame (frameIndex);	
		}

		//Vector2 newPos = Vector2.Lerp (currentPosition, targetPosition, movementSpeed * Time.deltaTime);
		float newAngle = Mathf.LerpAngle(currentAngle,targetAngle, movementSpeed * Time.deltaTime);
		float newRadius = Mathf.Lerp (currentRadius, targetRadius, movementSpeed * Time.deltaTime);
		SetPosition (newAngle, newRadius);
		LookAtCamera ();
	}

	void LookAtCamera() {
		Vector3 targetPosition = new Vector3 (
			mainCameraTransform.position.x,
			this.transform.position.y,
			mainCameraTransform.position.z);
		this.transform.LookAt (targetPosition);
		this.transform.Rotate (new Vector3 (90, 0, 0));
	}

}
