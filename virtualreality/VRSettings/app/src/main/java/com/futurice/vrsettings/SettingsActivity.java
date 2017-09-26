package com.futurice.vrsettings;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Environment;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import com.google.gson.Gson;
import com.futurice.Config;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class SettingsActivity extends AppCompatActivity implements View.OnClickListener {

    public static final String AUTHORITY = "com.futurice.vrsettings.provider";
    private Config config = null;

    private EditText serverUrl;
    private Button save;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        serverUrl = (EditText) findViewById(R.id.server_url);
        save = (Button) findViewById(R.id.save);
        save.setOnClickListener(this);
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_EXTERNAL_STORAGE},0);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},0);
        }

        File moviesDirectory = new File(Environment.getExternalStorageDirectory() + "/" +Environment.DIRECTORY_MOVIES);

        File configFile = new File(moviesDirectory, "config.json");
        if (configFile.exists()) {
            try {
                Gson builder = new Gson();
                FileReader fileReader = new FileReader(configFile);
                config = builder.fromJson(fileReader, Config.class);
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            }
        } else {
            config = new Config();
            config.serverUrl = "http://192.168.0.1";
        }

        if (config != null) {
            serverUrl.setText(config.serverUrl);
        }
    }

    private void saveConfig() {
        File moviesDirectory = new File(Environment.getExternalStorageDirectory() + "/" +Environment.DIRECTORY_MOVIES);
        File configFile = new File(moviesDirectory, "config.json");

        if (!configFile.exists()) {
            try {
                configFile.createNewFile();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        FileWriter fileWriter = null;
        try {
            fileWriter = new FileWriter(configFile);
            Gson gson = new Gson();
            String toJson = gson.toJson(config);
            fileWriter.write(toJson);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (fileWriter != null) {
                try {
                    fileWriter.close();
                    Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    @Override
    public void onClick(View v) {
        if (config == null) {
            config = new Config();
        }
        config.serverUrl = serverUrl.getText().toString();
        saveConfig();
    }
}
