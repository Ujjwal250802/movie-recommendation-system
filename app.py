import flask
import csv
from flask import Flask, render_template, request
import difflib
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random

app = flask.Flask(__name__, template_folder='templates')

df2 = pd.read_csv('./model/tmdb.csv')
count = CountVectorizer(stop_words='english')
count_matrix = count.fit_transform(df2['soup'])

cosine_sim2 = cosine_similarity(count_matrix, count_matrix)

df2 = df2.reset_index()
indices = pd.Series(df2.index, index=df2['title'])
all_titles = [df2['title'][i] for i in range(len(df2['title']))]

def get_similar_movies(title):
    cosine_sim = cosine_similarity(count_matrix, count_matrix)
    idx = indices[title]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:11]
    movie_indices = [i[0] for i in sim_scores]
    similar_titles = df2['title'].iloc[movie_indices]
    release_dates = df2['release_date'].iloc[movie_indices]
    ratings = df2['vote_average'].iloc[movie_indices]
    overviews = df2['overview'].iloc[movie_indices]
    keywords = df2['keywords'].iloc[movie_indices]
    movie_ids = df2['id'].iloc[movie_indices]

    return_df = pd.DataFrame(columns=['Title','Year'])
    return_df['Title'] = similar_titles
    return_df['Year'] = release_dates
    return_df['Ratings'] = ratings
    return_df['Overview'] = overviews
    return_df['Types'] = keywords
    return_df['ID'] = movie_ids
    return return_df

def get_suggestions():
    data = pd.read_csv('tmdb.csv')
    return list(data['title'].str.capitalize())

app = Flask(__name__)
@app.route("/")
@app.route("/index")
def index():
    new_movies = []
    with open('movieR.csv','r') as csvfile:
        readCSV = csv.reader(csvfile)
        new_movies.append(random.choice(list(readCSV)))
    movie_name = new_movies[0][0]
    movie_name = movie_name.title()
    
    with open('movieR.csv', 'a', newline='') as csv_file:
        fieldnames = ['Movie']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writerow({'Movie': movie_name})
        result_final = get_similar_movies(movie_name)
        names = []
        dates = []
        ratings = []
        overviews = []
        types = []
        movie_ids = []
        for i in range(len(result_final)):
            names.append(result_final.iloc[i][0])
            dates.append(result_final.iloc[i][1])
            ratings.append(result_final.iloc[i][2])
            overviews.append(result_final.iloc[i][3])
            types.append(result_final.iloc[i][4])
            movie_ids.append(result_final.iloc[i][5])
    suggestions = get_suggestions()
    
    return render_template('index.html', suggestions=suggestions, movie_type=types[5:], movieid=movie_ids, movie_overview=overviews, movie_names=names, movie_date=dates, movie_ratings=ratings, search_name=movie_name)


@app.route('/index3', methods=['GET', 'POST'])

def main():
    if flask.request.method == 'GET':
        return flask.render_template('index.html')

    if flask.request.method == 'POST':
        movie_name = flask.request.form['movie_name']
        movie_name = movie_name.title()
        if movie_name not in all_titles:
            return flask.render_template('index2.html', name=movie_name)
        else:
            with open('movieR.csv', 'a', newline='') as csv_file:
                fieldnames = ['Movie']
                writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                writer.writerow({'Movie': movie_name})
            result_final = get_similar_movies(movie_name)
            names = []
            dates = []
            ratings = []
            overviews = []
            types = []
            movie_ids = []
            for i in range(len(result_final)):
                names.append(result_final.iloc[i][0])
                dates.append(result_final.iloc[i][1])
                ratings.append(result_final.iloc[i][2])
                overviews.append(result_final.iloc[i][3])
                types.append(result_final.iloc[i][4])
                movie_ids.append(result_final.iloc[i][5])
               
            return flask.render_template('index3.html', movie_type=types[5:], movieid=movie_ids, movie_overview=overviews, movie_names=names, movie_date=dates, movie_ratings=ratings, search_name=movie_name)

if __name__ == '__main__':
    app.run()
