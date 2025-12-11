/**
 * Validation Utilities with Real-time Feedback
 * Professional validation patterns and error messages
 */

// Regex Patterns
export const PATTERNS = {
    // Email: Must contain @ and valid domain
    email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    // Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

    // Phone: Uganda format (+256 or 0) followed by 9 digits
    phoneUganda: /^(\+256|0)[7][0-9]{8}$/,

    // General phone: International format
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,

    // Name: Letters, spaces, hyphens only (2-50 chars)
    name: /^[a-zA-Z\s\-]{2,50}$/,

    // Business Name: Alphanumeric with spaces and common punctuation
    businessName: /^[a-zA-Z0-9\s\-&.,()]{2,100}$/,

    // TIN Number: Uganda TIN format (10 digits)
    tinUganda: /^[0-9]{10}$/,

    // Only letters and spaces
    lettersOnly: /^[a-zA-Z\s]+$/,

    // Only numbers
    numbersOnly: /^[0-9]+$/,

    // Alphanumeric
    alphanumeric: /^[a-zA-Z0-9]+$/,

    // No special characters except space
    noSpecialChars: /^[a-zA-Z0-9\s]+$/,

    // URL
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
}

// Error Messages
export const ERROR_MESSAGES = {
    email: {
        required: 'Email address is required',
        invalid: 'Please enter a valid email address (e.g., user@example.com)',
        noAt: 'Email must contain @ symbol',
        noDomain: 'Email must have a valid domain (e.g., @gmail.com)',
        exists: 'This email is already registered',
        notFound: 'No account found with this email'
    },
    password: {
        required: 'Password is required',
        tooShort: 'Password must be at least 8 characters long',
        noUppercase: 'Password must contain at least one uppercase letter',
        noLowercase: 'Password must contain at least one lowercase letter',
        noNumber: 'Password must contain at least one number',
        noSpecial: 'Password must contain at least one special character (@$!%*?&)',
        weak: 'Password is too weak. Please follow all requirements',
        mismatch: 'Passwords do not match'
    },
    name: {
        required: 'Name is required',
        invalid: 'Name can only contain letters, spaces, and hyphens',
        tooShort: 'Name must be at least 2 characters long',
        tooLong: 'Name cannot exceed 50 characters'
    },
    phone: {
        required: 'Phone number is required',
        invalid: 'Please enter a valid phone number',
        invalidUganda: 'Please enter a valid Uganda phone number (e.g., +256700000000 or 0700000000)',
        tooShort: 'Phone number is too short',
        tooLong: 'Phone number is too long'
    },
    businessName: {
        required: 'Business name is required',
        invalid: 'Business name contains invalid characters',
        tooShort: 'Business name must be at least 2 characters long',
        tooLong: 'Business name cannot exceed 100 characters'
    },
    tin: {
        required: 'TIN number is required',
        invalid: 'TIN must be exactly 10 digits',
        notNumeric: 'TIN can only contain numbers'
    },
    general: {
        required: 'This field is required',
        invalid: 'Please enter a valid value',
        serverError: 'An error occurred. Please try again',
        networkError: 'Network error. Please check your connection'
    }
}

// Validation Functions
export const validators = {
    /**
     * Validate email with detailed feedback
     */
    email(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.email.required }
        }

        // Check for @ symbol
        if (!value.includes('@')) {
            return { valid: false, message: ERROR_MESSAGES.email.noAt }
        }

        // Check for domain
        const parts = value.split('@')
        if (parts.length !== 2 || !parts[1].includes('.')) {
            return { valid: false, message: ERROR_MESSAGES.email.noDomain }
        }

        // Full regex validation
        if (!PATTERNS.email.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.email.invalid }
        }

        return { valid: true, message: '' }
    },

    /**
     * Validate password with strength requirements
     */
    password(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.password.required }
        }

        if (value.length < 8) {
            return { valid: false, message: ERROR_MESSAGES.password.tooShort }
        }

        if (!/[A-Z]/.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.password.noUppercase }
        }

        if (!/[a-z]/.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.password.noLowercase }
        }

        if (!/[0-9]/.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.password.noNumber }
        }

        if (!/[@$!%*?&]/.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.password.noSpecial }
        }

        return { valid: true, message: '' }
    },

    /**
     * Validate password confirmation
     */
    confirmPassword(password, confirmPassword) {
        if (!confirmPassword || confirmPassword.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.password.required }
        }

        if (password !== confirmPassword) {
            return { valid: false, message: ERROR_MESSAGES.password.mismatch }
        }

        return { valid: true, message: '' }
    },

    /**
     * Validate name
     */
    name(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.name.required }
        }

        if (value.length < 2) {
            return { valid: false, message: ERROR_MESSAGES.name.tooShort }
        }

        if (value.length > 50) {
            return { valid: false, message: ERROR_MESSAGES.name.tooLong }
        }

        if (!PATTERNS.name.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.name.invalid }
        }

        return { valid: true, message: '' }
    },

    /**
     * Validate Uganda phone number
     */
    phoneUganda(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.phone.required }
        }

        if (!PATTERNS.phoneUganda.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.phone.invalidUganda }
        }

        return { valid: true, message: '' }
    },

    /**
     * Validate business name
     */
    businessName(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.businessName.required }
        }

        if (value.length < 2) {
            return { valid: false, message: ERROR_MESSAGES.businessName.tooShort }
        }

        if (value.length > 100) {
            return { valid: false, message: ERROR_MESSAGES.businessName.tooLong }
        }

        if (!PATTERNS.businessName.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.businessName.invalid }
        }

        return { valid: true, message: '' }
    },

    /**
     * Validate TIN number
     */
    tin(value) {
        if (!value || value.trim() === '') {
            return { valid: false, message: ERROR_MESSAGES.tin.required }
        }

        if (!PATTERNS.numbersOnly.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.tin.notNumeric }
        }

        if (!PATTERNS.tinUganda.test(value)) {
            return { valid: false, message: ERROR_MESSAGES.tin.invalid }
        }

        return { valid: true, message: '' }
    }
}

/**
 * Get password strength
 */
export function getPasswordStrength(password) {
    if (!password) return { strength: 0, label: 'None', color: 'gray' }

    let strength = 0

    // Length
    if (password.length >= 8) strength += 20
    if (password.length >= 12) strength += 10
    if (password.length >= 16) strength += 10

    // Character types
    if (/[a-z]/.test(password)) strength += 15
    if (/[A-Z]/.test(password)) strength += 15
    if (/[0-9]/.test(password)) strength += 15
    if (/[@$!%*?&]/.test(password)) strength += 15

    // Determine label and color
    if (strength < 30) return { strength, label: 'Weak', color: 'red' }
    if (strength < 60) return { strength, label: 'Fair', color: 'orange' }
    if (strength < 80) return { strength, label: 'Good', color: 'yellow' }
    return { strength, label: 'Strong', color: 'green' }
}

/**
 * Real-time input sanitization
 */
export const sanitizers = {
    /**
     * Email: Convert to lowercase, trim spaces
     */
    email(value) {
        return value.toLowerCase().trim()
    },

    /**
     * Phone: Remove spaces and dashes
     */
    phone(value) {
        return value.replace(/[\s\-()]/g, '')
    },

    /**
     * Name: Capitalize first letter of each word
     */
    name(value) {
        return value
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    },

    /**
     * Numbers only
     */
    numbersOnly(value) {
        return value.replace(/[^0-9]/g, '')
    },

    /**
     * Letters only
     */
    lettersOnly(value) {
        return value.replace(/[^a-zA-Z\s]/g, '')
    }
}

/**
 * Prevent invalid characters in real-time
 */
export function preventInvalidInput(event, pattern) {
    const char = event.key

    // Allow control keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) {
        return true
    }

    // Test against pattern
    if (!pattern.test(char)) {
        event.preventDefault()
        return false
    }

    return true
}

export default {
    PATTERNS,
    ERROR_MESSAGES,
    validators,
    getPasswordStrength,
    sanitizers,
    preventInvalidInput
}
