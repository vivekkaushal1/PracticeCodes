import imaplib
import sys, getpass

pw = getpass.getpass('Password:')
server = imaplib.IMAP4_SSL('imap.gmail.com')
connection_message = server.login(sys.argv[1], pw)
print(connection_message)

print (server.select("inbox"))

#server.select("ALL MAIL")
sender ='' #senderEmail you want to delete.
result_status, email_ids = server.search(None, '(FROM "%s")' % sender)
emails = email_ids[0].split()

print ('%d emails found'%len(emails))
for x in emails:
    server.store(x,'+X-GM-LABELS', '\\Trash')
    pass
print ("Deleted %d messages. Closing connection & logging out."%len(emails))
server.logout()
