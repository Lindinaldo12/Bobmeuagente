package com.exemplo.app;

import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class MainActivity extends AppCompatActivity {

    private TextView textView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        textView = findViewById(R.id.textView);

        chamarBob();
    }

    private void chamarBob() {
        String apiKey = "";
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            apiKey = getString(R.string.openrouter_api_key);
        }
        String url = "https://openrouter.ai/api/v1/chat/completions";

        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
            .url(url)
            .header("Authorization", "Bearer " + apiKey)
            .header("HTTP-Referer", "https://bobmeuagente.onrender.com")
            .header("X-Title", "Android App")
            .post(null)
            .build();

        // TODO: Implementar chamada assíncrona e atualizar UI
    }
}
