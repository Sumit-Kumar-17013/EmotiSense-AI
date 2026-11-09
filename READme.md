🧠 AI Emotion Analyzer — Emotion Classification with BiGRU

An end-to-end deep learning project that classifies the emotion expressed in a piece of text. It covers data exploration, NLP preprocessing, a comparison of recurrent architectures (RNN, LSTM, GRU, BiGRU), and a deployed FastAPI backend with a modern, animated web interface.

The model predicts one of six emotions: sadness, joy, love, anger, fear, surprise.

✨ Features
Deep learning emotion classifier built with a stacked Bidirectional GRU (TensorFlow / Keras)
Compares four architectures: Simple RNN, LSTM, GRU and BiGRU
Class-weighted training and early stopping to handle imbalance and overfitting
REST API with FastAPI (/predict, /health) and input validation via Pydantic
Premium dark glassmorphism web UI (plain HTML, CSS, JavaScript, no frameworks)
Animated confidence ring and probability bars for all six emotions
Live backend status indicator, local analysis history, copy result, download report
Light and dark theme, responsive layout, reduced-motion support
🗂️ Project Structure
project-root/
├── Artifacts/
│   ├── BiGRU_Model.keras        # trained BiGRU model
│   └── tokenizer.pkl            # fitted Keras Tokenizer
├── static/
│   ├── index.html               # web interface
│   ├── css/style.css            # styling and animations
│   └── js/app.js                # frontend logic and API calls
├── main.py                      # FastAPI backend (rename to match your file)
├── Sentiment_Analysis.ipynb     # training and evaluation notebook
├── requirements.txt
├── runtime.txt
├── .gitignore
└── README.md
📊 Dataset
Source: dair-ai/emotion on Hugging Face
Size: 16,000 training, 2,000 validation and 2,000 test examples
Labels (6): sadness, joy, love, anger, fear, surprise
Data quality: checked for missing values; none found in text or label columns
🔬 What I Did in This Project

The full workflow is in Sentiment_Analysis.ipynb.

1. Loading and preparing data
Loaded the dataset with the Hugging Face datasets library.
Extracted label names and converted the data into Pandas DataFrames with readable emotion labels.
Checked for null values.
2. Exploratory Data Analysis
Plotted the emotion distribution as a count plot.
Plotted the class percentage distribution as a pie chart to understand class imbalance.
3. NLP preprocessing
Fitted a Keras Tokenizer (vocabulary limit of 10,000 words, with an out-of-vocabulary token). The full corpus contains 15,213 unique words.
Converted sentences into integer sequences.
Padded and truncated all sequences to a fixed length of 50 (post padding and truncation).
4. Shared training utilities
Computed balanced class weights with scikit-learn so rarer emotions are not ignored.
Used EarlyStopping (monitor val_loss, patience 3, restore best weights).
Common settings: Adam optimizer, sparse categorical cross-entropy, batch size 32, up to 20 epochs.
5. Phase 1: baseline models
Model	Architecture
Simple RNN	Embedding(128) → SimpleRNN(128) → Dropout → SimpleRNN(64) → Dropout → Dense(6)
LSTM	Embedding(6) → LSTM(128) → Dropout → LSTM(64) → Dropout → Dense(6)
GRU	Embedding(128) → GRU(128) → Dropout → GRU(64) → Dropout → Dense(6)

These plain recurrent models did not learn useful patterns in the settings I used (see results), which motivated the bidirectional model.

6. Phase 2: advanced Bidirectional GRU
Embedding(10000, 300)
→ Bidirectional(GRU(128, return_sequences=True))
→ Dropout(0.5)
→ Bidirectional(GRU(64))
→ Dropout(0.5)
→ Dense(6, softmax)

Reading the sentence in both directions lets each word be understood from the words before and after it.

7. Evaluation
Compared all models in a results table.
Plotted a confusion matrix for the BiGRU.
Tested the model on custom example sentences.
8. Saving and deploying
Saved the model to Artifacts/BiGRU_Model.keras and the tokenizer to Artifacts/tokenizer.pkl.
Built a FastAPI service that loads both at startup and serves predictions.
Designed a responsive web UI that talks to the real model through the API.
📈 Results
Model	Test Loss	Test Accuracy
Simple RNN	1.749	12.1%
GRU	1.828	3.6%
LSTM	1.800	3.6%
BiGRU	0.017	99.5%

⚠️ Important evaluation note: in the current notebook, the test_text and test_label variables are taken from the training split, so these figures were measured on data the models were trained on. The BiGRU's 99.5% therefore shows it fits the training data, not how well it generalizes. The dataset's own validation and test splits were not used yet. Re-running the evaluation on those splits (see Future Improvements) is needed for an honest accuracy figure, and the result will likely be lower.

Sample predictions from the notebook:

Sentence	Predicted
"I feel so alone and hopeless today."	sadness
"I am furious that they cancelled the trip at the last minute."	anger
"I feel terrified when walking down dark alleyways alone."	fear
"I was shocked and completely surprised by the unexpected gift!"	surprise
"I can't believe how happy I am right now, this is amazing!"	surprise (joy was expected)
🔌 API Reference

The backend is a FastAPI app with CORS enabled and static file hosting.

POST /predict

Request:

json
{ "text": "I feel so happy and excited" }

Text must be 1 to 2,000 characters.

Response:

json
{
  "text": "I feel so happy and excited",
  "predicted_emotion": "joy",
  "confidence": 0.97,
  "all_probabilites": {
    "sadness": 0.01, "joy": 0.97, "love": 0.01,
    "anger": 0.00, "fear": 0.01, "surprise": 0.00
  }
}

(Values are illustrative. Note that the key is spelled all_probabilites in the API.)

GET /health

Returns {"status": "Server is Running", "model_loaded": true}.

GET /

Serves the web interface (static/index.html).

Interactive API docs are available at http://127.0.0.1:8000/docs.

Backend preprocessing: text is lowercased, apostrophes are removed, non-alphanumeric characters become spaces, whitespace is collapsed, then the text is tokenized and padded to length 50.

🎨 Frontend
Hero section, analysis workspace, features, how-it-works flow and model information sections
Character and word counters, example sentences, random example generator
Animated circular confidence indicator and per-emotion probability bars, colored by emotion
Recent history saved in the browser (localStorage), with a clear option
Copy result and download text report
Backend connection status in the navigation bar
Responsive design, light/dark theme, accessibility focus states, prefers-reduced-motion support
🛠️ Tech Stack
Area	Tools
Language	Python 3.11
Deep learning	TensorFlow, Keras
Data and analysis	Pandas, NumPy, scikit-learn, Matplotlib, Seaborn
Dataset	Hugging Face datasets
Backend	FastAPI, Uvicorn, Pydantic
Frontend	HTML, CSS, JavaScript
🚀 Getting Started
bash
# 1. Clone the repository
git clone <your-repo-url>
cd <project-folder>

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server (replace "main" with your Python filename)
uvicorn main:app --reload

Open http://127.0.0.1:8000 in your browser.

To retrain the model, open Sentiment_Analysis.ipynb, run all cells, and the notebook will save new files into Artifacts/. The saved model and tokenizer must be loaded with the same TensorFlow and Keras versions used for training.

☁️ Deployment

Deploy on any Python host such as Render. Use start command:

uvicorn main:app --host 0.0.0.0 --port $PORT

runtime.txt pins the Python version. Keep the Artifacts/ folder in the repository so the model is available at startup (use Git LFS if the model exceeds 100 MB).

⚠️ Limitations
Evaluation currently uses the training split as the test set (see Results), so reported accuracy is optimistic.
The plain RNN, LSTM and GRU baselines did not converge, so the comparison is not a fair architecture benchmark yet.
The dataset consists of short, English, social-media-style sentences. Performance on long, formal or other-language text is untested.
The six-class label set cannot represent mixed or neutral emotions.
The notebook trains without the backend's apostrophe-removal step, a small preprocessing difference between training and serving.
🔮 Future Improvements
Evaluate on the dataset's real validation and test splits and report precision, recall, F1 and a confusion matrix per class
Use the validation split for early stopping instead of the test data
Tune and fix the baseline models for a fair comparison
Try pretrained embeddings (GloVe, FastText) or transformer models (DistilBERT)
Apply the exact same preprocessing function in training and serving
Add a neutral class and multi-label support
Add automated tests and a Docker setup
👤 Author

Sumit — B.Tech CSE (AI/ML), SRM University AP

Dataset credit: dair-ai/emotion.

📄 License

This project is for educational purposes. Add a license of your choice (for example MIT) before sharing publicly.