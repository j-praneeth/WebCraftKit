import * as nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', 
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'resumext.notifications@gmail.com', // fallback to default
    pass: process.env.EMAIL_PASSWORD || 'your-app-password-here' // you'll need to replace this
  }
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email server is ready to take messages');
  }
});

// Email templates
const emailTemplates = {
  interviewFeedback: (name: string, score: number, feedback: string[]) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .feedback-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
            .feedback-item:before { content: "•"; position: absolute; left: 0; color: #4F46E5; }
            .score { font-size: 24px; font-weight: bold; color: ${score >= 80 ? '#22C55E' : score >= 60 ? '#FACC15' : '#EF4444'}; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ResuNext.ai - Mock Interview Feedback</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Thank you for completing your mock interview with ResuNext.ai. Below is your feedback and score:</p>
              
              <h2>Overall Score: <span class="score">${score}%</span></h2>
              
              <h3>Feedback Summary:</h3>
              <div>
                ${feedback.map(item => `<div class="feedback-item">${item}</div>`).join('')}
              </div>
              
              <p>Keep practicing to improve your interview skills. You can schedule another mock interview anytime through our platform.</p>
              
              <p>Best regards,<br>The ResuNext.ai Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from ResuNext.ai. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
  
  questionSuggestions: (name: string, jobTitle: string, questions: string[]) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .question { margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #4F46E5; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ResuNext.ai - Interview Questions</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Here are some suggested interview questions for the <strong>${jobTitle}</strong> position you're interested in:</p>
              
              <div>
                ${questions.map((q, i) => `<div class="question"><strong>Q${i+1}:</strong> ${q}</div>`).join('')}
              </div>
              
              <p>We recommend practicing these questions before your interview. You can use our Mock Interview feature to get feedback on your responses.</p>
              
              <p>Best regards,<br>The ResuNext.ai Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message from ResuNext.ai. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
};

// Send email function
export async function sendEmail(
  to: string, 
  subject: string, 
  htmlContent: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"ResuNext.ai" <resumext.notifications@gmail.com>',
      to,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Helper functions to send specific emails
export async function sendInterviewFeedback(
  email: string, 
  name: string, 
  score: number, 
  feedback: string[]
): Promise<boolean> {
  const htmlContent = emailTemplates.interviewFeedback(name, score, feedback);
  return sendEmail(email, 'Your Mock Interview Feedback', htmlContent);
}

export async function sendInterviewQuestions(
  email: string, 
  name: string, 
  jobTitle: string, 
  questions: string[]
): Promise<boolean> {
  const htmlContent = emailTemplates.questionSuggestions(name, jobTitle, questions);
  return sendEmail(email, 'Suggested Interview Questions', htmlContent);
}