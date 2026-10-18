"""
Test persistence across database session disconnects and re-connections.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from database import get_db_context, check_connection
from models import User, Field
import uuid

def test_persistence_across_sessions():
    assert check_connection() is True
    unique_id = uuid.uuid4().hex[:6]
    test_phone = f"+9199{unique_id}"

    # Session 1: Create user and field
    user_id = None
    field_id = None
    with get_db_context() as db1:
        u = User(phone=test_phone, password="hashed_test_password", name="Persistence Test Farmer")
        db1.add(u)
        db1.flush()
        user_id = u.id

        f = Field(user_id=user_id, label="Persistent Plot A", area_ha=2.5, current_crop="Wheat")
        db1.add(f)
        db1.flush()
        field_id = f.id

    assert user_id is not None
    assert field_id is not None

    # Simulate complete connection termination and reconnect in Session 2
    with get_db_context() as db2:
        reloaded_user = db2.query(User).filter(User.id == user_id).first()
        assert reloaded_user is not None
        assert reloaded_user.phone == test_phone

        reloaded_field = db2.query(Field).filter(Field.id == field_id).first()
        assert reloaded_field is not None
        assert reloaded_field.label == "Persistent Plot A"
        assert reloaded_field.current_crop == "Wheat"

        # Cleanup test record
        db2.delete(reloaded_user)

    # Verify cleanup in Session 3
    with get_db_context() as db3:
        assert db3.query(User).filter(User.id == user_id).first() is None
        assert db3.query(Field).filter(Field.id == field_id).first() is None

    print("[OK] MySQL persistence across sessions verified successfully!")

if __name__ == "__main__":
    test_persistence_across_sessions()
