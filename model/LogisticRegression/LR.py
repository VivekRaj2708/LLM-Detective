import joblib

def Load():
    model = joblib.load('./LogisticRegression/logistic_regression_model.pkl')
    vectorizer = joblib.load('./LogisticRegression/tfidf_vectorizer.pkl')
    le_type = joblib.load('./LogisticRegression/label_encoder_type.pkl')
    le_model = joblib.load('./LogisticRegression/label_encoder_model.pkl')
    return model, vectorizer, le_type, le_model

