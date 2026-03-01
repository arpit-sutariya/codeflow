"""Tests for OT Engine — operation apply, transform convergence, inversion, cursor transform."""
import pytest
from ot_engine import Operation, transform, compose

class TestApply:
    def test_insert_beginning(self):
        op = Operation(); op.insert("Hi "); op.retain(5); op.base_length = 5
        assert op.apply("World") == "Hi World"

    def test_insert_middle(self):
        op = Operation(); op.retain(5); op.insert(" Big"); op.retain(6); op.base_length = 11
        assert op.apply("Hello World") == "Hello Big World"

    def test_delete(self):
        op = Operation(); op.retain(5); op.delete(1); op.retain(5); op.base_length = 11
        assert op.apply("Hello World") == "HelloWorld"

    def test_replace(self):
        op = Operation(); op.delete(5); op.insert("Bye"); op.retain(6); op.base_length = 11
        assert op.apply("Hello World") == "Bye World"

    def test_empty_doc_insert(self):
        op = Operation(); op.insert("Hello"); op.base_length = 0
        assert op.apply("") == "Hello"

    def test_wrong_length_raises(self):
        op = Operation(); op.retain(10); op.base_length = 10
        with pytest.raises(ValueError): op.apply("short")

class TestTransform:
    def test_convergence_inserts(self):
        doc = "Hello"
        a = Operation(); a.insert("X"); a.retain(5); a.base_length = 5
        b = Operation(); b.retain(5); b.insert("Y"); b.base_length = 5
        ap, bp = transform(a, b)
        assert bp.apply(a.apply(doc)) == ap.apply(b.apply(doc)) == "XHelloY"

    def test_convergence_insert_delete(self):
        doc = "Hello World"
        a = Operation(); a.insert("X"); a.retain(11); a.base_length = 11
        b = Operation(); b.retain(5); b.delete(1); b.retain(5); b.base_length = 11
        ap, bp = transform(a, b)
        assert bp.apply(a.apply(doc)) == ap.apply(b.apply(doc)) == "XHelloWorld"

    def test_convergence_same_delete(self):
        doc = "Hello World"
        a = Operation(); a.retain(5); a.delete(1); a.retain(5); a.base_length = 11
        b = Operation(); b.retain(5); b.delete(1); b.retain(5); b.base_length = 11
        ap, bp = transform(a, b)
        assert bp.apply(a.apply(doc)) == ap.apply(b.apply(doc)) == "HelloWorld"

    def test_same_position_inserts_converge(self):
        doc = "AB"
        a = Operation(); a.retain(1); a.insert("X"); a.retain(1); a.base_length = 2
        b = Operation(); b.retain(1); b.insert("Y"); b.retain(1); b.base_length = 2
        ap, bp = transform(a, b)
        assert bp.apply(a.apply(doc)) == ap.apply(b.apply(doc))

class TestInvert:
    def test_invert_insert(self):
        doc = "Hello"
        op = Operation(); op.retain(5); op.insert(" World"); op.base_length = 5
        new = op.apply(doc)
        assert op.invert(doc).apply(new) == doc

    def test_invert_delete(self):
        doc = "Hello World"
        op = Operation(); op.retain(5); op.delete(6); op.base_length = 11
        new = op.apply(doc)
        assert op.invert(doc).apply(new) == doc

    def test_invert_complex(self):
        doc = "The quick brown fox"
        op = Operation(); op.retain(4); op.delete(5); op.insert("slow"); op.retain(10); op.base_length = 19
        new = op.apply(doc)
        assert op.invert(doc).apply(new) == doc

class TestCursor:
    def test_insert_before_pushes_right(self):
        op = Operation(); op.insert("XX"); op.retain(10); op.base_length = 10
        assert op.transform_cursor(5) == 7

    def test_insert_after_no_change(self):
        op = Operation(); op.retain(10); op.insert("XX"); op.base_length = 10
        assert op.transform_cursor(5) == 5

    def test_delete_before_pulls_left(self):
        op = Operation(); op.delete(3); op.retain(7); op.base_length = 10
        assert op.transform_cursor(5) == 2

class TestCompose:
    def test_two_inserts(self):
        doc = "Hello"
        a = Operation(); a.retain(5); a.insert(" World"); a.base_length = 5
        b = Operation(); b.retain(11); b.insert("!"); b.base_length = 11
        c = compose(a, b)
        assert c.apply(doc) == b.apply(a.apply(doc)) == "Hello World!"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
