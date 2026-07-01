UPDATE UserAccount
SET last_login_at = GETDATE()
WHERE id = @userId
