# Dev Log

## March 5
Changes
-Refractored the category,lessons and the topics.
-Converted nested state into seperate flat states

Completed:
-Sepreated states instead of nested structure on server side

Pending:
-Add courseSchema validation
-Add Build Course Payload for structured course payload
-Add duration hook for video duration parsing in the lesson part
-Refractor remaining logic for category and topics.
-Add Frontend architecture for new fields :
  -

## March 6
Changes
-Refractored the category,lessons and the topics.
-Added hooks for parsing video duration , payload builder for payload
 and error validation schema for errors


Completed:
-Added hooks for parsing video duration , payload builder for payload
 and error validation schema for errors.
-Added courseSchema validation
-Added Build Course Payload for structured course payload


Pending:
-Add courseSchema validation
-Add Build Course Payload for structured course payload
-Add duration hook for video duration parsing in the lesson part
-Refractor remaining logic for category and topics.
-Add Frontend architecture for new fields :
  -

## March 7
Changes
-Added frontend architecture for lessons and topics


Completed:
-Added frontend architecture for lessons and topics


## March 9
Changes
--Refractored the category,lessons and the topics.
-Added hooks for parsing video duration , payload builder for payload
and error validation schema for errors





## March 10
Changes
--Refractored the category,lessons and the topics in update Course.
-Added hooks for parsing video duration , payload builder for payload
and error validation schema for errors



## March 11
Changes
--Refractored the category,lessons and the topics in update Course controller.
--Added diff Schema function to get only values to update instead of whole document
-- Refractored the put controller added transactions based updation for consistency and to prevent error 

Pending:

-Refractor remaining logic for category and topics for create and edit course component.
-Add Frontend architecture for new fields :
-topics
-lessons
-category


## March 12
Changes
--Refractored the category,lessons and the topics in update Course controller.
--Added diff Schema function to get only values to update instead of whole document
-- Refractored the put controller added transactions based updation for consistency and to prevent error 
-Refractor remaining logic for category and topics for create and edit course component.

Pending:

-Add Frontend architecture for new fields :
-topics
-lessons
-category

## March 13
Changes
--Refractored the certificate controller.
--Added Certificate creation logic with background worker
--Added BullMQ queue with redis 
--Added generate certificate service
--Added worker 
--Added uploadToCloudinary service

Pending:
-complete certification logic and sync with background job
-Add Frontend architecture for new fields :
-topics
-lessons
-category

## March 14
Changes
--Refractored the certificate controller.
--Added Certificate creation logic with background worker
--Added BullMQ queue with redis 
--Added generate certificate service
--Added worker 
--Added uploadToCloudinary service

completed
--certificate creation with background jobs
Pending:
-complete certification creation on the basis of progress 
-complete certification logic and sync with background job
-Add Frontend architecture for new fields :
-topics
-lessons
-category
## March 15
Changes
--Refractored the review create ,update.
--Refractored like course route


Pending:
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
## March 18
Changes
--Refractored the review create ,update and delete route.
--Refractored get route for course
-Refractored dislike controller with newly normalised models

completed
Refractored the review create ,update and delete route.
--Refractored get route for course
-Refractored dislike controller with newly normalised models

Pending:
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
-

## March 19
Changes
--Refractored like course Route.
--Refractored get user progress  Route.


Completed
--Refractored the like course route.
--Refractored get user progress  Route.

Pending:
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress



-chat
-message
-cart routes

## March 19
Changes

--Refractored get and create user progress  Route.




Pending:
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress



-chat
-message
-cart routes
## March 22
Changes

--Refractored post user progress  Route.
-Refractored & added background worker with service and the queue for progress management in the background




Pending:
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress



-chat
-message
-cart routes
## March 24
Changes

--Refractored post user progress  Route.
-Refractored & added background worker with service and the queue for progress management in the background

Completed
-Refractored & added background worker with service and the queue for progress management in the background


Pending:
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress



-chat
-message
-cart routes
## March 25
Changes

-Added custom next Request type that extends existing nextrequest so we can log ip of unauthorized access
--Refractored email verfication Route and moved this logic to the worker.
--Refractored post user progress  Route.
-Refractored & added background worker with service and the queue for progress management in the background

Completed
-Refractored & added background worker with service and the queue for progress management in the background


Pending:
-Add custom next request with ip log in all the routes in logger
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress



-chat
-message
-cart routes
## March 26
Changes
--Refractored File upload Route
--Refractored email verfication Route and moved this logic to the worker.
--Refractored post user progress  Route.


Completed
--Refractored File upload Route
--Refractored email verfication Route and moved this logic to the worker.
-Added custom next Request type that extends existing nextrequest so we can log ip of unauthorized access



Pending:
-Complete The file upload route with optimisation
-Add custom next request with ip log in all the routes in logger
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress



-chat
-message
-cart routes



## April 4
Changes
--Refractored File upload Route
--Refractored email verfication Route and moved this logic to the worker.
--Refractored post user progress  Route.


Completed

--Refractored email verfication Route and moved this logic to the worker.
-Added custom next Request type that extends existing nextrequest so we can log ip of unauthorized access



Pending:
-Complete The file upload route with optimisation
-Add custom next request with ip log in all the routes in logger
-complete review
-Add Frontend architecture for new fields :
-topics
-lessons
-category
-review
-like course
-rate limiting and helpful score calculation
-Calculate spam score and userBehaviour
- calculate helpful reviews on with score
- update progress and delete progress
-current Upload Architecuture
Frontend → Backend (get signature)
Frontend → Cloudinary (direct upload)
Frontend → Backend (save metadata)


-chat
-message
-cart routes