using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DanceFloor : MonoBehaviour {

	[SerializeField]
	GameObject floorTilePrefab;

	// timer for flashes
	float timer = 0.0f;
	float interval = 0.5f;

	// everything is square..
	// vars for making this dynamic later on
	int floorSize = 24;
	float tileSize = 0.8f;

	DanceFloorTile[] tiles;

	// Use this for initialization
	void Start () {
		GenerateDanceFloor (floorSize);
	}

	void GenerateDanceFloor(int floorSize) {

		float width = floorSize * tileSize;
		float offset = - width / 2;
		tiles = new DanceFloorTile[floorSize*floorSize];
		Quaternion rotation = Quaternion.Euler(Vector3.left*90);

		for (int x = 0; x < floorSize; x++) {
			for (int y = 0; y < floorSize; y++) {
				Vector3 pos = new Vector3 (offset + x * tileSize, 0, offset + y * tileSize);
				GameObject floorTile = GameObject.Instantiate (floorTilePrefab, pos, rotation);
				floorTile.transform.parent = transform;
				DanceFloorTile tile = floorTile.GetComponent<DanceFloorTile> ();
				tile.SetColor ((x/2 +x) + (y/2 +y));
				tiles [x + y * floorSize] = tile;
			}
		}
	}

	// Update is called once per frame
	void Update () {
		timer += Time.deltaTime;
		if (timer > interval) {
			timer = 0.0f;
			foreach (DanceFloorTile tile in tiles) {
				tile.NextColor ();
			}
		}
	}
}
