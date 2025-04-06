// This file provides JavaScript-safe type definitions for use in our serverless environment
// Without causing TypeScript declaration conflicts during build

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} passwordHash - Hashed password
 * @property {boolean} [otpEnabled] - Whether 2FA is enabled
 * @property {string} [otpSecret] - Secret for 2FA
 * @property {boolean} [requiresOtp] - Whether OTP verification is required
 */

/**
 * @typedef {Object} UserWithRole
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} passwordHash - Hashed password
 * @property {boolean} [otpEnabled] - Whether 2FA is enabled
 * @property {string} [otpSecret] - Secret for 2FA
 * @property {boolean} [requiresOtp] - Whether OTP verification is required
 * @property {boolean} isAdmin - Whether user is an admin
 */

/**
 * @typedef {Object} InsertUser
 * @property {string} username - Username
 * @property {string} password - Plain text password (for creation only)
 */

/**
 * @typedef {Object} Product
 * @property {number} id - Product ID
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {number} price - Product price
 * @property {string} category - Product category
 * @property {string} imageUrl - Product image URL
 * @property {string} slug - Product slug for URLs
 * @property {boolean} featured - Whether product is featured
 * @property {string} [reviews] - JSON string of product reviews
 */

/**
 * @typedef {Object} ProductReview
 * @property {string} id - Review ID
 * @property {string} name - Reviewer name
 * @property {string} [avatar] - Reviewer avatar URL
 * @property {string} date - Review date
 * @property {number} rating - Review rating (1-5)
 * @property {string} comment - Review comment
 * @property {number} helpfulCount - Number of helpful votes
 */

/**
 * @typedef {Object} InsertProduct
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {number} price - Product price
 * @property {string} category - Product category
 * @property {string} imageUrl - Product image URL
 * @property {string} slug - Product slug for URLs
 * @property {boolean} featured - Whether product is featured
 */

/**
 * @typedef {Object} CartItem
 * @property {number} id - Cart item ID
 * @property {string} sessionId - Session ID
 * @property {number} productId - Product ID
 * @property {number} quantity - Quantity
 * @property {Product} [product] - Product details (joined)
 */

/**
 * @typedef {Object} InsertCartItem
 * @property {string} sessionId - Session ID
 * @property {number} productId - Product ID
 * @property {number} quantity - Quantity
 */

/**
 * @typedef {Object} Contact
 * @property {number} id - Contact ID
 * @property {string} name - Contact name
 * @property {string} email - Contact email
 * @property {string} message - Contact message
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} InsertContact
 * @property {string} name - Contact name
 * @property {string} email - Contact email
 * @property {string} message - Contact message
 */

module.exports = {
  // These are just placeholders since we're only using JSDoc for documentation
  // No actual exports needed as these are just type definitions
};