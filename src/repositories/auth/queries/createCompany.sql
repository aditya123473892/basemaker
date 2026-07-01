INSERT INTO Company (name, is_active)
OUTPUT INSERTED.id, INSERTED.name
VALUES (@name, 1)
