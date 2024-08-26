document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Add event listener for form submission
  document.querySelector('#compose-form').onsubmit = send_email;
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Fetch emails for the specified mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Clear any previous emails
        document.querySelector('#emails-view').innerHTML += '';

        // Display each email
        emails.forEach(email => {
            const emailElement = document.createElement('div');
            emailElement.className = 'email';
            emailElement.style.border = '1px solid black';
            emailElement.style.margin = '5px';
            emailElement.style.padding = '10px';
            emailElement.style.backgroundColor = email.read ? 'lightgray' : 'white';

            emailElement.innerHTML = `
                <strong>From:</strong> ${email.sender} <br>
                <strong>Subject:</strong> ${email.subject} <br>
                <strong>Timestamp:</strong> ${email.timestamp}
            `;

            document.querySelector('#emails-view').append(emailElement);
            emailElement.addEventListener('click', () => view_email(email.id));

            document.querySelector('#emails-view').append(emailElement);
        });
    });
}


function send_email(event) {
  event.preventDefault(); // Prevent default form submission
  
  // Collect form data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send POST request to /emails
  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      }),
      headers: {
          'Content-Type': 'application/json'
      }
  })
  .then(response => response.json())
  .then(result => {
      if (result.message) {
          console.log(result.message); // Log success message
          load_mailbox('sent'); // Load sent mailbox
      } else {
          console.error(result.error); // Log error message
      }
  })
  .catch(error => console.error('Error:', error));
}

function view_email(email_id) {
  // Show the email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Fetch the email details
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Display the email details
      document.querySelector('#email-view').innerHTML = `
          <strong>From:</strong> ${email.sender} <br>
          <strong>To:</strong> ${email.recipients.join(', ')} <br>
          <strong>Subject:</strong> ${email.subject} <br>
          <strong>Timestamp:</strong> ${email.timestamp} <br><br>
          ${email.body}
      `;

    // Create and append the reply button
    const replyButton = document.createElement('button');
    replyButton.innerHTML = 'Reply';
    replyButton.addEventListener('click', () => reply_email(email));
    document.querySelector('#email-view').append(replyButton);  

    // Create and append the archive/unarchive button
    const archiveButton = document.createElement('button');
    archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
    archiveButton.addEventListener('click', () => {
        // Send PUT request to update archived status
        fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
        })
        .then(() => {
            // Clear the email details
            document.querySelector('#email-view').innerHTML = '';

            // Reload inbox after archiving/unarchiving
            load_mailbox('inbox');
        });
    });

    function reply_email(email) {
        // Pre-fill the composition form
        compose_email({
            recipients: email.sender,
            subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
            body: `On ${email.timestamp} ${email.sender} wrote:\n\n${email.body}\n\n`
        });
    }
    
    function compose_email(prefill = {}) {
        // Show compose view and hide other views
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#email-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';
    
        // Clear out or pre-fill composition fields
        document.querySelector('#compose-recipients').value = prefill.recipients || '';
        document.querySelector('#compose-subject').value = prefill.subject || '';
        document.querySelector('#compose-body').value = prefill.body || '';
    }

    

    document.querySelector('#email-view').append(archiveButton);

      // Mark the email as read
      if (!email.read) {
          fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
          });
      }
  });
}

 