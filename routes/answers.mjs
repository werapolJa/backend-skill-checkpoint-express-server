import { Router } from "express";
import connectionPool from "../utils/db.mjs";


const answersRouter = Router()



answersRouter.post("/:answerId/vote", async (req, res) => {
    const postAnswerIdVote = req.params.answerId; 
    const { vote } = req.body; 
    // console.log(postAnswerIdVote);
    // console.log(vote);
    
    if (!vote) {
      return res.status(400).json({ message: "Invalid vote value" });
    }
  
    try {
      const answersCheck = await connectionPool.query(
        "SELECT * FROM answers WHERE id = $1",
        [postAnswerIdVote]
      );
      if (answersCheck.rowCount === 0) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
     await connectionPool.query(
        "INSERT INTO answer_votes (vote, answer_id) VALUES ($1, $2) ",
        [vote, postAnswerIdVote]
      );
    
      return res.status(201).json({
        message: "Vote on the answer has been recorded successfully"
      });
    } catch {
      return res.status(500).json({ message: "Unable to vote answer" });
    }
});

  export default answersRouter