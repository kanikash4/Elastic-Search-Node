var nodemailer = require('nodemailer');
var transport = require('nodemailer-smtp-pool');
var email_config =  require('../config/email');

var mailer = nodemailer.createTransport(transport(email_config.transport));

var email = {
  send: function (mailOptions, cb) {
    var mail = {};
    mail.subject = mailOptions.subject + " : "+ new Date();
    mail.text = mailOptions.body || mailOptions.text;
    mail.from = mailOptions.from || email_config.sender;
    mail.to = mailOptions.to;
    mail.cc = mailOptions.cc;
    mail.bcc = mailOptions.bcc;
    mail.html = mailOptions.html || mailOptions.body;

    if (mailOptions.headers) {
      mail.headers = {
        'X-SMTPAPI': JSON.stringify(mailOptions.headers)
      };
    }

    if (mailOptions.attachments) {
      mail.attachments = mailOptions.attachments;
    }

    mailer.sendMail(mail, cb);
  }
};

module.exports = email;

/*---------------------------------------------Driver Function------------------------------------------------------*/

(function () {
  if (require.main === module) {
    var mail = {
      subject: "Test mail",
      body: "Hello World!",
      from: 'testidsh4@gmail.com',
      to: 'testidsh4@gmail.com',
      html: "Hello World!"
    };
    mailer.sendMail(mail, console.log);
  }
}());
