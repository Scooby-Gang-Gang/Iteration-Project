require("dotenv").config({ path: "../.env" });
const { Pool } = require("pg");

const databaseConfig = { connectionString: process.env.DATABASE_URL };

//creating a new pool
const pool = new Pool(databaseConfig);

// pool.query("SELECT NOW()", (err, res) => {
//   console.log(`error: ${err}`);
//   console.log(`response: ${JSON.parse(JSON.stringify(res))}`);
//   console.log("Starting...");
//   console.log(err, res);
//   pool.end();
// });

const queriesRouter = {
  query: (text, params, callback) => {
    console.log("executed query", text);
    return pool.query(text, params, callback);
  },

  //gets the workouts list from the DB as an array of workout objects
  getWorkoutsList: (req, res, next) => {
    pool
      .query(
        `SELECT a.athlete_name, w.* 
              FROM workout_card w
              JOIN athletes a
                ON w.athlete_id = a._id
              ORDER BY date DESC;`
      )
      .then((workoutsListData) => {
        if (!workoutsListData) return next({ log: "no workouts found" });
        res.locals.workoutsList = workoutsListData.rows;
        return next();
      })
      .catch((err) =>
        next({
          log: "error retrieving workoutsList from database",
          message: { err: `error received from workoutsList query: ${err}` },
        })
      );
  },

  //takes in athlete_id & workout_content from req.body and queries to add
  //entry to workout_card table in the database

  postWorkout: (req, res, next) => {
    const { athlete_id, workout_content, workout_title } = req.body;
    // console.log(athlete_id, workout_content, workout_title);
    pool
      .query(
        `INSERT INTO workout_card (workout_content, date, workout_title, athlete_id) VALUES ('${workout_content}', NOW(), '${workout_title}', '${athlete_id}');`
      )
      .then((data) => {
        // console.log(data);
        return next();
      })
      .catch((err) =>
        next({
          log: "error posting workout to workout_card table in database",
          message: { err: `error received from postWorkout query: ${err}` },
        })
      );
  },

  //gets the workouts list from the DB as an array of workout objects
  getWorkoutsByAthlete: (req, res, next) => {
    const athleteId = req.query.id;
    console.log(athleteId);

    if (athleteId === undefined) return next({ log: "no athlete_id found" });

    pool
      .query(
        `SELECT a.athlete_name, w.* 
              FROM workout_card w
              JOIN athletes a
                ON w.athlete_id = a._id
                WHERE a._id = ${athleteId}
              ORDER BY date DESC;`
      )
      .then((workoutsListData) => {
        // console.log(workoutsListData);
        if (!workoutsListData.rows[0])
          return next({ log: "no workouts found for this athlete" });
        res.locals.workoutsList = workoutsListData.rows;
        return next();
      })
      .catch((err) =>
        next({
          log: "error retrieving workoutsList of this athlete from database",
          message: {
            err: `error received from workoutsList by athlete query: ${err}`,
          },
        })
      );
  },

  //gets the athlete info from the DB (just the name to start with)
  getAthleteInfo: (req, res, next) => {
    const athleteId = req.query.id;

    if (athleteId === undefined) return next({ log: "no athlete_id found" });

    pool
      .query(
        `SELECT athlete_name 
        FROM athletes 
        WHERE _id = ${athleteId};`
      )
      .then((dbResponse) => {
        if (!dbResponse.rows[0]) {
          return next({ log: "no athlete found with this id" });
        }
        // console.log(dbResponse.rows[0].athlete_name);
        res.locals.athleteName = dbResponse.rows[0].athlete_name;
        return next();
      })
      .catch((err) =>
        next({
          log: "error retrieving name of this athlete from database",
          message: {
            err: `error received from athlete info query by athlete id: ${err}`,
          },
        })
      );
  },
};

module.exports = queriesRouter;
