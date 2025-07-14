#!/usr/bin/env python3
"""
Backend API Testing for Roblox Gear Hub
Tests authentication, gear management, and suggestions system
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://ff1d7d13-cb43-4f20-9a14-68c410ec56f9.preview.emergentagent.com/api"

# Test credentials
ROOT_USERNAME = "root"
ROOT_PASSWORD = "Mouse123890!"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, passed, message):
        self.results.append({
            'test': test_name,
            'passed': passed,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        print()
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed/total*100):.1f}%" if total > 0 else "No tests run")
        
        if self.failed > 0:
            print(f"\nFAILED TESTS:")
            for result in self.results:
                if not result['passed']:
                    print(f"- {result['test']}: {result['message']}")

def test_authentication():
    """Test user authentication system"""
    results = TestResults()
    
    # Test 1: Login with root credentials
    try:
        login_data = {
            "username": ROOT_USERNAME,
            "password": ROOT_PASSWORD
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            
            # Verify token structure
            if all(key in token_data for key in ['access_token', 'token_type', 'role']):
                if token_data['role'] == 'créateur':
                    results.add_result(
                        "Root User Login", 
                        True, 
                        f"Successfully logged in as {ROOT_USERNAME} with role: {token_data['role']}"
                    )
                    return results, token_data['access_token']
                else:
                    results.add_result(
                        "Root User Login", 
                        False, 
                        f"Expected role 'créateur', got '{token_data['role']}'"
                    )
            else:
                results.add_result(
                    "Root User Login", 
                    False, 
                    f"Invalid token structure: {token_data}"
                )
        else:
            results.add_result(
                "Root User Login", 
                False, 
                f"Login failed with status {response.status_code}: {response.text}"
            )
    except Exception as e:
        results.add_result(
            "Root User Login", 
            False, 
            f"Exception during login: {str(e)}"
        )
    
    return results, None

def test_gear_management(auth_token):
    """Test gear management API"""
    results = TestResults()
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test 1: Get all gears
    try:
        response = requests.get(f"{BACKEND_URL}/gears")
        
        if response.status_code == 200:
            gears = response.json()
            
            # Check if we have gears
            if isinstance(gears, list):
                # Check categories
                categories = set(gear.get('category') for gear in gears)
                expected_categories = {'joueurs', 'modérateur', 'événements', 'interdits'}
                
                if expected_categories.issubset(categories):
                    results.add_result(
                        "Get All Gears", 
                        True, 
                        f"Retrieved {len(gears)} gears with all 4 categories: {categories}"
                    )
                else:
                    results.add_result(
                        "Get All Gears", 
                        False, 
                        f"Missing categories. Expected: {expected_categories}, Got: {categories}"
                    )
            else:
                results.add_result(
                    "Get All Gears", 
                    False, 
                    f"Expected list of gears, got: {type(gears)}"
                )
        else:
            results.add_result(
                "Get All Gears", 
                False, 
                f"Failed to get gears. Status: {response.status_code}, Response: {response.text}"
            )
    except Exception as e:
        results.add_result(
            "Get All Gears", 
            False, 
            f"Exception: {str(e)}"
        )
    
    # Test 2: Create a new gear (requires responsable+ role)
    try:
        new_gear = {
            "name": "Test Sword",
            "nickname": "TestSword",
            "gear_id": "123456789",
            "image_url": "https://tr.rbxcdn.com/test-image.png",
            "description": "A test sword for testing purposes",
            "category": "joueurs"
        }
        
        response = requests.post(f"{BACKEND_URL}/gears", json=new_gear, headers=headers)
        
        if response.status_code == 200:
            created_gear = response.json()
            if created_gear.get('name') == new_gear['name']:
                results.add_result(
                    "Create Gear", 
                    True, 
                    f"Successfully created gear: {created_gear.get('name')}"
                )
                
                # Test 3: Update the created gear
                gear_id = created_gear.get('id')
                if gear_id:
                    updated_gear = new_gear.copy()
                    updated_gear['description'] = "Updated test description"
                    
                    update_response = requests.put(
                        f"{BACKEND_URL}/gears/{gear_id}", 
                        json=updated_gear, 
                        headers=headers
                    )
                    
                    if update_response.status_code == 200:
                        results.add_result(
                            "Update Gear", 
                            True, 
                            "Successfully updated gear"
                        )
                    else:
                        results.add_result(
                            "Update Gear", 
                            False, 
                            f"Update failed. Status: {update_response.status_code}"
                        )
                    
                    # Test 4: Delete the created gear
                    delete_response = requests.delete(f"{BACKEND_URL}/gears/{gear_id}", headers=headers)
                    
                    if delete_response.status_code == 200:
                        results.add_result(
                            "Delete Gear", 
                            True, 
                            "Successfully deleted gear"
                        )
                    else:
                        results.add_result(
                            "Delete Gear", 
                            False, 
                            f"Delete failed. Status: {delete_response.status_code}"
                        )
            else:
                results.add_result(
                    "Create Gear", 
                    False, 
                    f"Created gear data mismatch: {created_gear}"
                )
        else:
            results.add_result(
                "Create Gear", 
                False, 
                f"Failed to create gear. Status: {response.status_code}, Response: {response.text}"
            )
    except Exception as e:
        results.add_result(
            "Create Gear", 
            False, 
            f"Exception: {str(e)}"
        )
    
    return results

def test_suggestions_system(auth_token):
    """Test suggestions system"""
    results = TestResults()
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test 1: Submit suggestion (public endpoint - no auth required)
    try:
        suggestion_data = {
            "name": "Lightning Bolt",
            "nickname": "LightBolt",
            "gear_id": "987654321",
            "image_url": "https://tr.rbxcdn.com/lightning-bolt.png",
            "description": "A powerful lightning bolt gear",
            "category": "événements"
        }
        
        response = requests.post(f"{BACKEND_URL}/suggestions", json=suggestion_data)
        
        if response.status_code == 200:
            created_suggestion = response.json()
            suggestion_id = created_suggestion.get('id')
            
            if created_suggestion.get('status') == 'pending':
                results.add_result(
                    "Submit Suggestion", 
                    True, 
                    f"Successfully submitted suggestion: {created_suggestion.get('name')}"
                )
                
                # Test 2: Get suggestions (requires modérateur+ role)
                try:
                    get_response = requests.get(f"{BACKEND_URL}/suggestions", headers=headers)
                    
                    if get_response.status_code == 200:
                        suggestions = get_response.json()
                        
                        if isinstance(suggestions, list) and len(suggestions) > 0:
                            # Find our suggestion
                            our_suggestion = next((s for s in suggestions if s.get('id') == suggestion_id), None)
                            
                            if our_suggestion:
                                results.add_result(
                                    "Get Suggestions", 
                                    True, 
                                    f"Retrieved {len(suggestions)} suggestions including our test suggestion"
                                )
                                
                                # Test 3: Approve suggestion (requires responsable+ role)
                                try:
                                    approve_response = requests.put(
                                        f"{BACKEND_URL}/suggestions/{suggestion_id}/approve", 
                                        headers=headers
                                    )
                                    
                                    if approve_response.status_code == 200:
                                        results.add_result(
                                            "Approve Suggestion", 
                                            True, 
                                            "Successfully approved suggestion and created gear"
                                        )
                                        
                                        # Verify gear was created
                                        gears_response = requests.get(f"{BACKEND_URL}/gears")
                                        if gears_response.status_code == 200:
                                            gears = gears_response.json()
                                            created_gear = next((g for g in gears if g.get('name') == suggestion_data['name']), None)
                                            
                                            if created_gear:
                                                results.add_result(
                                                    "Verify Approved Gear Created", 
                                                    True, 
                                                    f"Approved suggestion successfully created gear: {created_gear.get('name')}"
                                                )
                                            else:
                                                results.add_result(
                                                    "Verify Approved Gear Created", 
                                                    False, 
                                                    "Approved suggestion did not create gear in database"
                                                )
                                    else:
                                        results.add_result(
                                            "Approve Suggestion", 
                                            False, 
                                            f"Approval failed. Status: {approve_response.status_code}, Response: {approve_response.text}"
                                        )
                                except Exception as e:
                                    results.add_result(
                                        "Approve Suggestion", 
                                        False, 
                                        f"Exception: {str(e)}"
                                    )
                            else:
                                results.add_result(
                                    "Get Suggestions", 
                                    False, 
                                    "Could not find our test suggestion in the list"
                                )
                        else:
                            results.add_result(
                                "Get Suggestions", 
                                False, 
                                f"Expected list of suggestions, got: {suggestions}"
                            )
                    else:
                        results.add_result(
                            "Get Suggestions", 
                            False, 
                            f"Failed to get suggestions. Status: {get_response.status_code}, Response: {get_response.text}"
                        )
                except Exception as e:
                    results.add_result(
                        "Get Suggestions", 
                        False, 
                        f"Exception: {str(e)}"
                    )
            else:
                results.add_result(
                    "Submit Suggestion", 
                    False, 
                    f"Expected status 'pending', got '{created_suggestion.get('status')}'"
                )
        else:
            results.add_result(
                "Submit Suggestion", 
                False, 
                f"Failed to submit suggestion. Status: {response.status_code}, Response: {response.text}"
            )
    except Exception as e:
        results.add_result(
            "Submit Suggestion", 
            False, 
            f"Exception: {str(e)}"
        )
    
    return results

def test_database_initialization():
    """Test database initialization with sample data"""
    results = TestResults()
    
    try:
        response = requests.get(f"{BACKEND_URL}/gears")
        
        if response.status_code == 200:
            gears = response.json()
            
            if isinstance(gears, list) and len(gears) >= 8:
                # Check distribution across categories
                category_counts = {}
                for gear in gears:
                    category = gear.get('category')
                    category_counts[category] = category_counts.get(category, 0) + 1
                
                expected_categories = ['joueurs', 'modérateur', 'événements', 'interdits']
                all_categories_present = all(cat in category_counts for cat in expected_categories)
                
                if all_categories_present:
                    results.add_result(
                        "Database Initialization", 
                        True, 
                        f"Database properly initialized with {len(gears)} gears across all categories: {category_counts}"
                    )
                else:
                    results.add_result(
                        "Database Initialization", 
                        False, 
                        f"Missing categories in database. Found: {list(category_counts.keys())}, Expected: {expected_categories}"
                    )
            else:
                results.add_result(
                    "Database Initialization", 
                    False, 
                    f"Expected at least 8 gears, found {len(gears) if isinstance(gears, list) else 0}"
                )
        else:
            results.add_result(
                "Database Initialization", 
                False, 
                f"Failed to retrieve gears for database check. Status: {response.status_code}"
            )
    except Exception as e:
        results.add_result(
            "Database Initialization", 
            False, 
            f"Exception: {str(e)}"
        )
    
    return results

def main():
    """Run all backend tests"""
    print("🚀 Starting Roblox Gear Hub Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*60)
    
    all_results = TestResults()
    
    # Test 1: Authentication
    print("1️⃣ Testing Authentication System...")
    auth_results, auth_token = test_authentication()
    all_results.results.extend(auth_results.results)
    all_results.passed += auth_results.passed
    all_results.failed += auth_results.failed
    
    if not auth_token:
        print("❌ Authentication failed - cannot proceed with authenticated tests")
        all_results.summary()
        return False
    
    # Test 2: Database Initialization
    print("2️⃣ Testing Database Initialization...")
    db_results = test_database_initialization()
    all_results.results.extend(db_results.results)
    all_results.passed += db_results.passed
    all_results.failed += db_results.failed
    
    # Test 3: Gear Management
    print("3️⃣ Testing Gear Management API...")
    gear_results = test_gear_management(auth_token)
    all_results.results.extend(gear_results.results)
    all_results.passed += gear_results.passed
    all_results.failed += gear_results.failed
    
    # Test 4: Suggestions System
    print("4️⃣ Testing Suggestions System...")
    suggestion_results = test_suggestions_system(auth_token)
    all_results.results.extend(suggestion_results.results)
    all_results.passed += suggestion_results.passed
    all_results.failed += suggestion_results.failed
    
    # Final summary
    all_results.summary()
    
    return all_results.failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)