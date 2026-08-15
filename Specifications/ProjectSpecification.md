# Project Specification: Premier League Predictions 2026/27

## 1. Project Overview
*   **Project Summary:** 
This is a web application that will allow users to predict the outcome of the final Premier League standings for the 2026/27 season before the commencement of the first match of the season (opening fixture Friday 21 August 2026, 8pm BST). The application will need to update the leaderboard as the season progresses by using an api call to the Premier League API. This leaderboard will allow users to compare the predicted vs current standing of each team in the Premier League. Each user will gain points for accuracy according to a points table and the total points for each user will be displayed.
*   **Problem Statement:** 
The application will need to provide an input form that captures the user's predictions for the final Premier League standings for the 2026/27 season before the commencement of the first match of the season (opening fixture Friday 21 August 2026, 8pm BST). 

There are 20 teams in the Premier League. The Premier Leagues API will be used to extract the team names, IDs  and positions and store them in a database. The Premier League API call will need to be made by imitating a browser request. The API call will need to be made when the application is loaded. No more than 2 API calls will be made per minute. The API URL and the data structure will be provided later in this document.





*   **Vision:** 
The project may be used for future seasons of the Premier League.


## 2. Goals and Objectives
*   **Primary Goals:** 


## 3. Target Audience
*   Only 4 users are involved in this project. The users are:
    *   Clive
    *   John
    *   Dingle
    *   Chris

    Chris is the admin user.

## 4. Functional Requirements
*   **Core Features:** 
    *   The application will need to provide a page that displays an input form for each user to capture the user's predictions for the final Premier League standings for the 2026 season. A table should be provided with each of the 20 teams in the Premier League. Each team will have a column for the team position and a column for the team name preceded by the team logo. There then will follow a column for the user to input the predicted position of the team.  These predictions i.e. team name/id's and predicted positions should saveable to the user database when all 20 predictions are made and be editable by the user until the first match of the season. No two team positions by the user can be the same.
    *   Each user will be assigned a code that will need to be entered to access the input form. These codes will the unique identifier for each user and will be stored in a user database that contains the predictions of the user. the code will need to be entered to start editing the predictions for the first time and for each subsequent edit. 
    *   The application will need to provide a leaderboard that displays the current Premier League standings for the 2026 season. The Premier League Standings will need to be updated each time the Leaderboard is viewed. 
    *   The Premier League standings will be taken from the Premier League API and stored in a Premier League database. When a Premier League database is viewed, the application should check the age of the data in the database. If the age is greater than 3 minutes then the application should call the Premier League API to update the database. This should prevent the application from making too many API calls.
    *   The Leaderboard will need to display the predicted vs current standings for each team in the Premier League. The predicted standings will be taken from the user database and the current standings will be taken from the Premier League database.
    *   The leaderboard will be sorted according to the current positions of the teams in the Premier League. There will be a column for the team position and a column for the team name preceded by the team logo. There then will follow a column for each user that shows the predicted position of the team. this predicted position will be colour coded according to how close the predicted position is to the current position i.e. the same will be green, within 1 will be yellow and any more will be red.

    *   The leaderboard will need to display the total points for each user at the bottom of the user column. The total points will be calculated by adding up the points for each team in the Premier League according to the points system.
*   **Points System:** The scoring for each predicted team position is calculated as follows:

    *   **Base Points:**
        *   **2 points** for an exactly correct prediction (`predicted == actual`).
        *   **1 point** if the prediction is off by one position (`|predicted - actual| == 1`).

    *   **Bonus Points (in addition to Base Points):**
        *   **+2 points** for correctly predicting the champion (position #1).
        *   **+1 point** for correctly predicting a team in the top 4 (positions #2, #3, or #4).
        *   **+1 point** for correctly predicting a team in the relegation zone (positions #18, #19, or #20).

    *   **Consolation Points (for off-by-one predictions in key zones):**
        *   If a prediction is off by one, and both the predicted and actual positions are within the top 4 (#1-#4), the user still receives **1 point**.
        *   If a prediction is off by one, and both the predicted and actual positions are within the relegation zone (#18-#20), the user still receives **1 point**.

## 5. Non-Functional Requirements
*   **Performance:** 
Page load time should be under 2 seconds
*   **Security:** 
The imput form should be protected from SQL injection and cross site scripting attacks. The Premier League API should be protected from SQL injection and cross site scripting attacks.
The inputs should be validated to ensure that they are valid i.e. numbers between 1 and 20.

## 6. Technical Stack
*   **Frontend:** 
The frontend will be built using NextJs (App Router), Shadcn UI and Tailwind CSS, deployed on Vercel.
*   **Backend:** 
The backend uses NextJs server actions and API routes running on Vercel's serverless Node runtime (required for iron-session auth and the standings-update endpoints; GitHub Pages cannot host these).
*   **Database:** 
The database will be a serverless Neon Postgres database accessed via drizzleORM. A fresh database instance is used for each season.
*   **Theme:**
Emerald & Teal (light-first), distinct from the 2025/26 slate theme.


## 8. UI/UX Design
*   **Design Principles:** Are there any specific design principles to follow? (e.g., "Minimalist," "Modern," "Playful").
*   **Wireframes/Mockups:** 
The site should have a modern and clean design. The site should be responsive and mobile friendly and follow a design similar to the following:
https://www.premierleague.com/en/tables?competition=8&season=2026&round=L_1&matchweek=1&ha=-1

*   **Style Guide:** The style guide should be similar to the light theme of the following:
https://www.premierleague.com/en/tables?competition=8&season=2026&round=L_1&matchweek=1&ha=-1

## 9. Data Model
*   **Database Schema:** The JSON schema for the Premier League API is as per thedatabase should be similar to the file "premierLeagueAPI.json" in the "Specifications" folder.

The API has an entry for each matchweek. The data for the latest matchweek should be used to determine the current standings. For the matchweek, tables[0].entries will contain an array. For each element x in the array entries, entries[x].team.name will provide the team name, entries[x].team.id will provide the team id, entries[x].overall.position will provide the current position of the team.



## 11. Deployment and Operations
*   **CI/CD:** The repository is connected to Vercel; pushes to the production branch deploy automatically and pull requests get preview deployments.
*   **Logging and Monitoring:** The application is deployed to Vercel and monitored using Vercel's built-in logs and analytics.

## 12. Assumptions and Constraints
*   **Assumptions:** The simplest design will be used to build the application.
*   **Constraints:** The application will be built using the latest version of NextJs, Shadcn UI and Tailwind CSS, and only use Free tier services.

## 14. Rules to Adhere To
*   **Coding Standards:** The application will be built using the latest version of NextJs, Shadcn UI and Tailwind CSS.
*   **Version Control:** Version control through Github.
*   **Testing Strategy:** No testing will be performed.