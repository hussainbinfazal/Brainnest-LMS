import nextJest from 'next/jest'

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv:[""]

    
}