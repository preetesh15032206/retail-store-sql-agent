"""
AI Database Agent / AI SQL Assistant - Python & Streamlit Reference Implementation
Converts natural language questions into safe, validated MySQL queries.
"""

import os
import re
import time
import json
import pandas as pd
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# Page configuration
st.set_page_config(
    page_title="AI Database Agent",
    page_icon="🗄️",
    layout="wide"
)

# Multi-layer SQL Validator
FORBIDDEN_KEYWORDS = [
    r'\bINSERT\b', r'\bUPDATE\b', r'\bDELETE\b', r'\bDROP\b', r'\bALTER\b',
    r'\bTRUNCATE\b', r'\bCREATE\b', r'\bGRANT\b', r'\bREVOKE\b', r'\bRENAME\b',
    r'\bREPLACE\b', r'\bCALL\b', r'\bEXEC\b', r'\bEXECUTE\b', r'\bLOAD DATA\b',
    r'\bINTO OUTFILE\b', r'\bINTO DUMPFILE\b'
]

def validate_sql(sql: str, schema_tables: list = None):
    errors = []
    clean_sql = sql.strip().rstrip(';')

    # 1. No comments
    if re.search(r'(--|#|/\*)', clean_sql):
        errors.append("SQL comments are not allowed.")

    # 2. Must start with SELECT or WITH
    if not re.match(r'^(SELECT|WITH)\b', clean_sql, re.IGNORECASE):
        errors.append("Only read-only SELECT or WITH statements are allowed.")

    # 3. Forbidden keywords
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, clean_sql, re.IGNORECASE):
            errors.append(f"Forbidden command detected matching pattern: {pattern}")

    # 4. Result size limit
    if not re.search(r'\bLIMIT\s+\d+\b', clean_sql, re.IGNORECASE):
        clean_sql = f"{clean_sql} LIMIT 100"

    is_valid = len(errors) == 0
    return is_valid, clean_sql, errors

st.title("🗄️ AI Database Agent")
st.caption("Ask questions. Explore data. Get answers. Powered by Gemini Flash & MySQL.")

st.info("💡 You are currently viewing the Python/Streamlit reference code. To run the full interactive web application, use port 3000 where the full-stack React + Express + In-Memory SQL engine is running live.")
