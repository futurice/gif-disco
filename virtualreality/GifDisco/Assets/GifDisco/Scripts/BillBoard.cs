using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BillBoard : MonoBehaviour {

	Transform mainCameraTransform;

	// Use this for initialization
	void Start () {
		mainCameraTransform = Camera.main.transform;
	}

	// Update is called once per frame
	void Update () {
		LookAtCamera ();
	}

	void LookAtCamera() {
		Vector3 targetPosition = new Vector3 (
			mainCameraTransform.position.x,
			this.transform.position.y,
			mainCameraTransform.position.z);
		this.transform.LookAt (targetPosition);
	}
}
