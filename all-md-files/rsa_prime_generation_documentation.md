# RSA Prime Generation Documentation

## I. Overview
This document outlines the process of generating large prime numbers for RSA encryption, including the calculation of the modulus and verification of its prime factors.

## II. Selected Large Primes
1. **Prime Numbers Used**:
   - **p**: 1,000,000,007
   - **q**: 1,000,000,019

## III. Calculation of Modulus
1. **Modulus Formula**:
   
   \[ n = p \times q \]

2. **Calculation**:
   
   \[ n = 1,000,000,007 \times 1,000,000,019 \]

3. **Result**:
   - **Modulus**: 1,000,000,026,000,000,133

## IV. Factoring the Modulus
1. **Verification of Factors**:
   - The modulus can be expressed as the product of its prime components:
   
   \[ n = p \times q \]
   
   Where:
   - **p**: 1,000,000,007
   - **q**: 1,000,000,019

2. **Calculation Confirmation**:
   - Verifying that:
   
   \[ n = 1,000,000,007 \times 1,000,000,019 = 1,000,000,026,000,000,133 \]

## V. Conclusion
This documentation confirms the generation of the modulus for RSA encryption using the selected large primes. The modulus is suitable for cryptographic applications, ensuring security through the difficulty of factoring large composite numbers.
