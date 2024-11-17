import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const questionsRouter = Router()
questionsRouter.get("/", async (req, res) => {
    let result;
    try {
        result = await connectionPool.query("select * from questions");
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch questions." })
    }
    return res.status(200).json({
        data: result.rows
    });
});
questionsRouter.get("/:questionId(\\d+)", async (req, res) => {
    // ใช้ chatGPT
    // ปัญหาที่เจอ 
    // พอยิง api ด้วย postman ที่เส้น api /questions/search แต่ api /questions/:questionId ถูกเรียกใช้แทน
    // แก้ไขด้วย
    // (\\d+) ที่ใช้เพราะจะดักแค่ id เท่านั้น
    const questionIdClient = req.params.questionId
    // console.log(questionIdClient);
    let result;
    try {
        result = await connectionPool.query("select * from questions where id = $1", [questionIdClient]);
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch questions" })
    }
    if (!result.rows[0]) {
        return res.status(404).json({ message: "Question not found" })
    }
    return res.status(200).json({
        data: result.rows[0]
    });

});
questionsRouter.post("/", async (req, res) => {
    const newQuestions = {
        ...req.body
    }
    if (!newQuestions.title || !newQuestions.description || !newQuestions.category) {
        return res.status(400).json({ "message": "Invalid request data" })
    }
    console.log(newQuestions);

    try {

        await connectionPool.query(
            `INSERT INTO questions (title, description, category) VALUES ($1, $2, $3)`,
            [newQuestions.title, newQuestions.description, newQuestions.category]
        );

    } catch (error) {
        return res.status(500).json({ "message": "Unable to create question" });
    }
    return res.status(201).json({
        message: "Question created successfully."
    });
})
questionsRouter.put("/:questionId", async (req, res) => {
    const questionIdPut = req.params.questionId
    const newQuestions = {
        ...req.body
    }
    if (!newQuestions.title || !newQuestions.description || !newQuestions.category) {
        return res.status(400).json({ "message": "Invalid request data" })
    }
    // console.log(newQuestions);

    try {

        const result = await connectionPool.query(
            `UPDATE questions 
          SET title = $2,
               description = $3,
               category = $4
           WHERE id = $1`,
            [questionIdPut, newQuestions.title, newQuestions.description, newQuestions.category]
        );
        // console.log(result);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Question not found" })
        }
    } catch (error) {
        return res.status(500).json({ "message": "Unable to fetch questions" });
    }
    // ****** ผมไม่แน่ใจว่าควรจะ return ข้างใน หรือ นอก try ครับ ขอคำแนะนำหน่อยครับ *******
    return res.status(201).json({
        message: "Question updated successfully"
    });
})
questionsRouter.delete("/:questionId", async (req, res) => {
    const questionIdDelete = req.params.questionId
    // console.log(questionIdDelete);
    try {
        const result = await connectionPool.query(
            `DELETE FROM  questions
          where id = $1
          `, [questionIdDelete]
        )
        // console.log(result);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Question not found" })
        }
    } catch (error) {
        return res.status(500).json({ message: "Unable to delete question" })
    }
    return res.status(200).json({ message: "Question post has been deleted successfully" })

})


//ใช้ chatGpt คิดไม่ออกเลย แต่พอจะทำความเข้าใจโค๊ดได้ครับ ต้องทำบ่อยๆ
questionsRouter.get("/search", async (req, res) => {
    const { title, category } = req.query;

    // console.log(title);
    if (!title && !category) {
        return res.status(400).json({ message: "Invalid search parameters." });
    }

    let query = "SELECT * FROM questions WHERE 1=1";
    const values = [];
    let counter = 1;

    if (title) {
        query += ` AND title ILIKE $${counter}`;
        values.push(`%${title}%`);
        counter++;
    }
    if (category) {
        query += ` AND category ILIKE $${counter}`;
        values.push(`%${category}%`);
        counter++;
    }

    try {
        const result = await connectionPool.query(query, values);
        return res.status(200).json(result.rows);
    } catch {
        return res.status(500).json({ message: "Unable to fetch a question" });
    }
});


questionsRouter.get("/:questionId/answers", async (req, res) => {
    //ใช้ chatGpt แก้ตรง query
    const answersQuestionId = req.params.questionId;
    // console.log(answersQuestionId);
    try {
        const result = await connectionPool.query("SELECT id, content FROM answers WHERE question_id = $1", [answersQuestionId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Question not found." });
        }
        // console.log(result.rows);

        return res.status(200).json({ data: result.rows });
    } catch {
        return res.status(500).json({ message: "Unable to fetch answers." });
    }
});
questionsRouter.post("/:questionId/answers", async (req, res) => {
    const postQuestionIdAnswers = req.params.questionId;
    const { content } = req.body;

    // console.log(content);

    if (!content) {
        return res.status(400).json({ message: "Invalid request data" });
    }

    try {
        // ใช้ chatGpt นึกไม่ออกว่าจะ check ว่า paramiter ที่รับมามีข้อมูลอยู่ใน database ไหม

        const answersCheck = await connectionPool.query(
            "SELECT * FROM questions WHERE id = $1",
            [postQuestionIdAnswers]
        );

        if (answersCheck.rowCount === 0) {
            return res.status(404).json({ message: "Question not found" });
        }
        //ใช้ chatGpt แก้ตรง query
        await connectionPool.query(
            "INSERT INTO answers (content, question_id) VALUES ($1, $2) ",
            [content, postQuestionIdAnswers]
        );

        return res.status(201).json({
            message: "Answer created successfully."
        });
    } catch {
        return res.status(500).json({ message: "Unable to create answer." });
    }
});
questionsRouter.delete("/:questionId/answers", async (req, res) => {
    const deleteQuestionIdAnswer = req.params.questionId
    // console.log(questionIdDelete);
    try {

        const result = await connectionPool.query(
            `DELETE FROM  answers
        where question_id = $1
        `, [deleteQuestionIdAnswer]
        )
        // console.log(result);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Question not found" })
        }
    } catch (error) {
        return res.status(500).json({ message: "Unable to delete answers" })
    }
    return res.status(200).json({ message: "Delete answers for a question" })

})


questionsRouter.post("/:questionId/vote", async (req, res) => {
    const postQuestionIdVote = req.params.questionId;
    const { vote } = req.body;
    // console.log(postQuestionIdVote);
    // console.log(vote);

    if (!vote) {
        return res.status(400).json({ message: "Invalid vote value" });
    }

    try {
        const questionsCheck = await connectionPool.query(
            "SELECT * FROM questions WHERE id = $1",
            [postQuestionIdVote]
        );
        if (questionsCheck.rowCount === 0) {
            return res.status(404).json({ message: "Question not found" });
        }

        await connectionPool.query(
            "INSERT INTO question_votes (vote, question_id) VALUES ($1, $2) ",
            [vote, postQuestionIdVote]
        );

        return res.status(201).json({
            message: "Vote on the question has been recorded successfully"
        });
    } catch {
        return res.status(500).json({ message: "Unable to create answer." });
    }
});

export default questionsRouter

