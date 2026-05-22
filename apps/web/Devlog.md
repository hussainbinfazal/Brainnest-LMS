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

## April 28
Changes
--Refractored File upload Route
--Refractored & moved the upload architecture to hybrid uplaod with signature generated on backend & direct upload on cloudinary sdk 


Completed

--Refractored generate signature route 
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## April 29
Changes
--Refractored & optimised File upload Route with dynamic file type
--Refractored & moved the upload architecture to hybrid uplaod with signature generated on backend & direct upload on cloudinary sdk 




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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 2
Changes
--Refractored file upload functions and added size based file upload processes 
--Added size based client side router so file can uplaod hassle free on the basis of the file size

Pending:
-Complete The file upload route with optimisation and backend route for very large files
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 6
Changes
--Refractored client side components and added large file handling with chunk based upload 
--Refractored chunk based upload logic and integrated redis to store uplaod releated data on backend to tackle situation in case of partial succes and can resume with only missing chunks  
--Refractored file upload functions and added size based file upload processes 



Pending:
-Complete The file upload route with optimisation and backend route for very large files
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 7
Changes
--Refractored middleware to track the request with request so we can track the in the pipeline and added duration to track the latency request call
--Debugged chunk based upload logic and debugged redis config   
--Refractored &debugged file upload functions and added size based file upload processes with try catch to catch & log error early. 



Pending:
-setup workers and the chat in different node server
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes


## May 7
Changes
--Refractored middleware to track the request with request so we can track the in the pipeline and added duration to track the latency request call
--Configured worker on new server to reduce latency   




Pending:
-setup workers and the chat in different node server
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 12
Changes
--Refractored & added workers on the new express server 
--Refractored middleware to track the request with request so we can track the in the pipeline and added duration to track the latency request call
--Configured worker on new server to reduce latency   




Pending:
-setup workers and the chat in different node server and services, models
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes
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

## April 28
Changes
--Refractored File upload Route
--Refractored & moved the upload architecture to hybrid uplaod with signature generated on backend & direct upload on cloudinary sdk 


Completed

--Refractored generate signature route 
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## April 29
Changes
--Refractored & optimised File upload Route with dynamic file type
--Refractored & moved the upload architecture to hybrid uplaod with signature generated on backend & direct upload on cloudinary sdk 




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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 2
Changes
--Refractored file upload functions and added size based file upload processes 
--Added size based client side router so file can uplaod hassle free on the basis of the file size

Pending:
-Complete The file upload route with optimisation and backend route for very large files
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 6
Changes
--Refractored client side components and added large file handling with chunk based upload 
--Refractored chunk based upload logic and integrated redis to store uplaod releated data on backend to tackle situation in case of partial succes and can resume with only missing chunks  
--Refractored file upload functions and added size based file upload processes 



Pending:
-Complete The file upload route with optimisation and backend route for very large files
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 7
Changes
--Refractored middleware to track the request with request so we can track the in the pipeline and added duration to track the latency request call
--Debugged chunk based upload logic and debugged redis config   
--Refractored &debugged file upload functions and added size based file upload processes with try catch to catch & log error early. 



Pending:
-setup workers and the chat in different node server
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes


## May 7
Changes
--Refractored middleware to track the request with request so we can track the in the pipeline and added duration to track the latency request call
--Configured worker on new server to reduce latency   




Pending:
-setup workers and the chat in different node server
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 15
Changes
--Refractored the entire application into a monorepo architecture using Turborepo workspace structure
--Moved the existing Next.js application into apps/web for scalable multi-service architecture
--Added packages/shared workspace for reusable configs, logger, schemas, types and shared utilities
--Configured pnpm workspace with apps/* and packages/* package linking
--Initialized shared package architecture with independent tsconfig and package configuration
--Configured shared logger architecture using Pino for structured high-performance logging across services
--Added centralized reusable logger package for both web and worker services
--Configured TypeScript build structure with rootDir and outDir for scalable package compilation output
--Started separating infrastructure concerns from business logic for future distributed services architecture
--Prepared architecture for isolated worker deployment and independent service scaling
--Configured workspace-ready project structure for Dockerized development and deployment environments 




Pending:
-setup workers and the chat in different node server and services, models
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes


## May 17
Changes
--Refractored and added the index.ts for export as barrel export for better import statements throughout the workspaces
--Refractored certificate Service to upload data in stream with streamifier on on the worker server

--Refractored the types and added them in the root index.ts for better export throughout the workspaces




Pending:
-setup workers and the chat in different node server and services, models
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes

## May 20
Changes
--Refractored the whole certificate service on worker and added aggregation pipeline in the query for optimization
--Wrapped types with HydratedDocument from mongoose so type safety remains uncompromised
--Added Generic schema validators to protect the code from the error 
--Refractored the types and added them in the root index.ts for better export throughout the workspaces




Pending:
-setup the progress service in the worker side and also refractor the calculate percentage step in the pipeline
-setup workers and the chat in different node server and services, models
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes


## May 20
Changes
--Refractored the whole certificate service on worker and added aggregation pipeline in the query for optimization

completed
--completed the update progress service 
--Refractored & optimized the whole updateProgress function and added the whole new step in the aggregation pipeline to count & store completedLessonsCount as precomputed aggregation pattern
--


Pending:

-setup workers and the chat in different node server and services, models
-Complete The file upload route with optimisation and backend route for very large files over 500 mb (optimisation)
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
-cloudinary frontend upload architecture and save metadata to db in backend on the backend

-chat
-message
-cart routes