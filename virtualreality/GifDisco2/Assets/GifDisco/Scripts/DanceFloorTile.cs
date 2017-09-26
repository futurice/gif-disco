using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DanceFloorTile : MonoBehaviour {

	Material material;

	[SerializeField]
	Color[] colors;
	int colorIndex;

	// Use this for initialization
	void Start () {
		Renderer renderer = GetComponent<Renderer> ();
		Material[] mats = renderer.materials;
		// todo: some random pattern for colors
		foreach (Material mat in mats) {
			if (mat.name.Equals("DanceFloorEmitter (Instance)")) {
				material = mat;
			}
		}
		NextColor ();
	}

	public void SetColor(int initialColor) {
		colorIndex = initialColor % colors.Length;
	}

	void RandomColor() {
		colorIndex = Random.Range (0, colors.Length);
		material.SetColor ("_EmissionColor", colors[colorIndex]);
	}

	public void NextColor() {
		colorIndex = (colorIndex+1) % colors.Length;
		material.SetColor ("_EmissionColor", colors[colorIndex]);
	}
}
