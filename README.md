<html><body>
<h3>node-red-nis-nodes</h3>

Author: Meku Kun (michaelmruta@yahoo.com)

A collection of <a target="_blank" href="http://nodered.org/">Node-RED</a> nodes for
<a target="_blank" href="http://naturalintelligence.solutions/">lloopp</a> Toolbox (propietary).

### Installation

The latest release of these nodes can be installed by running:

	$ cd node-red/
    $ npm install node-red-nis-nodes

### lloopp Toolbox nodes

<h4>00-inspect</h4>
A node used to inspect a message.

<h4>00-once</h4>
Similar to inject but limits the frequency of input to 1 every 10 seconds.

<h4>01-rich text</h4>
Super Simple WYSIWYG Editor.

<h4>38-date-filter</h4>
A node used to filter data by date. Filters messages whose date attribute is within the given date range.

<h4>39-csv-parse</h4>
A function that parses the <b>msg.payload</b> to convert csv to/from a javascript object.

<h4>40-campaign</h4>
Campaign Mechanics. This node works in conjunction with <code>provision</code> node. 

<h4>41-provision</h4>
Provisioning node. This node is an essential component to Campaign Workflow.

<h4>42-aerospike</h4>
A node used to retrieve data using <strong>msg.payload.id</strong> in an Aerospike database. Returns <strong>msg.profile</strong>.

<h4>42-couchbase</h4>
A node used to retrieve data using <strong>msg.profile.id</strong> in an Couchbase database. This node is an essential component to Campaign Workflow.


<h4>43-interpreter</h4>
An <strong>interpreter</strong> is a computer program that directly executes, i.e. performs, instructions written in a programming or scripting language, without previously compiling them into a machine language program. Works with Bash, C/C++ - PicoC, Java - JVM, Lua, MATLAB, PHP, Python, R, Ruby.

<h4>43-javascript</h4>
Advanced Utilities/Functions. Function, Moment, Underscore, Durable, Backbone, jQuery, MapRed & Squel.

<h4>43-kue</h4>
Kue is a priority job queue backed by redis. Creates a queue when <strong>msg.topic</strong> is equal to <code>create</code>,  starts the queue when <code>process</code>, pauses the queue when <code>pause</code> and resumes when <code>resume</code>.

<h4>43-query</h4>
jQuery QueryBuilder. This node is a SQL query builder. Sends once <strong>msg.topic</strong> containing a SQL query.

<h4>43-rules</h4>
jQuery QueryBuilder + sift. This is just an advanced object filter and does not contain any algorithm. If you want to use a <strong>rete based rules engine</strong>, refer to <strong>durable</strong> in <strong>javascript</strong> node instead. This node is an essential component to Campaign Workflow.

<h4>44-silverstreet</h4>
Silverstreet Node. Used for sending SMS using Silverstreet HTTP-MT API.

<h4>45-smpp</h4>
This is a complete implementation of SMPP v5.0 in node.js, with support for custom commands and TLVs.

<h4>46-ftp</h4>
Basic FTP.

<h4>47-source-monitor</h4>
Keeps track of files in a directory or tables in a database. Sends each source as message when <strong>msg.topic</strong> is <code>next</code>.

<h4>48-file-stream</h4>
Streamable :: Reads the specified file and sends the content as <b>msg.payload</b>, and the filename as <b>msg.filename</b>.

<h4>49-clone</h4>
Clones an attribute.

<h4>49-log4js</h4>
Log4js node takes a log message using <strong>msg.payload</strong> or complete <strong>msg</strong> object and log level in <strong>msg.logger</strong>. Creates a JSON event logger which contain the whole message if <strong>json</strong> is checked.

<h4>50-camera</h4>
This node captures images from camera.

<h4>50-http-file-upload</h4>
This is a http endpoint for [POST] file upload. 

<h4>51-emovu</h4>
Use the image endpoint to extract age, gender, emotion, face recognition results and more from static images. All common image formats including .jpg, .bmp, .png, .tif, and .pgm are supported. For a detailed description visit <a href="http://emovu.com/docs/html/web_api.htm">http://emovu.com/docs/html/web_api.htm

<h4>52-camera-emovu</h4>
This node captures images from camera and sends it to emovu.

<h4>52-image-viewer</h4>
This node is an image viewer.

<h4>53-rekognition</h4>
This node makes <strong>`Rekognition API::Celebrity Recognize`</strong> request. Takes an <i>image URL</i> in <strong>msg.topic</strong>.

<h4>55-facepp</h4>
This node makes <strong>Face++ API</strong> request.

<h4>60-imdb</h4>
In-memory database using LokiJS.

<h4>60-prediction</h4>
PredictionIO is an open-source Machine Learning server for developers and data scientists to build and deploy predictive applications in a fraction of the time.

<h4>60-R</h4>
RIO, R Input Output, connects an app to Rserve, a TCP/IP server which allows other programs to use facilities of R.

<h4>61-complex-evt</h4>
Complex Event is a series of event collectively grouped in a timeframe.

<h4>62-statistics</h4>
A node used to implement a descriptive, regression, and inference statisticss.

<h4>66-loop-ai</h4>
This node executes both <strong>computeGenomeUsingFacebook</strong> & <strong>retrieveGenome</strong> from Person Genome API of loop.ai in mashape.

<h4>67-core-nlp</h4>
A node that provides a set of natural language analysis tools which can take raw English language text input and give the base forms of words, their parts of speech, whether they are names of companies, people, etc., normalize dates, times, and numeric quantities, and mark up the structure of sentences in terms of phrases and word dependencies, and indicate which noun phrases refer to the same entities.

<h4>67-lda</h4>
Latent Dirichlet allocation (LDA) topic modeling in javascript for node.js. LDA is a machine learning algorithm that extracts topics and their related keywords from a collection of documents.

<h4>68-google-translate</h4>
A node that provides a set of natural language analysis tools which can take raw English language text input and give the base forms of words, their parts of speech, whether they are names of companies, people, etc., normalize dates, times, and numeric quantities, and mark up the structure of sentences in terms of phrases and word dependencies, and indicate which noun phrases refer to the same entities.

<h4>70-rpc</h4>
rpc server/reciever & rpc transmitter

<h4>70-splunk-kvs</h4>
This node inserts/updates data to a Splunk KV Store.

<h4>75-BIDMach</h4>
CPU and GPU-accelerated Machine Learning Library.

<h4>76-mshadow</h4>
MShadow is a lightweight CPU/GPU Matrix/Tensor Template Library in C++/CUDA.

<h4>77-nlp-comprimise</h4>
A Natural-Language-Processing library in Javascript.

<h4>79-cuda</h4>
CUDA is a parallel computing platform and application programming interface (API) model created by NVIDIA.

<h4>79-soap</h4>
SOAP Client to make SOAP API requests and SOAP Server to listen to external SOAP API requests.

<h4>81-counter</h4>
Counts all the events. This node is an essential component to Campaign Workflow.

<h4>82-webhdfs</h4>
WebHDFS REST API.

<h4>83-map-reduce</h4>
Google's MapReduce implementation for NodeJS.

<h4>84-cassandra</h4>
The Apache Cassandra database is the right choice when you need scalability and high availability without compromising performance.

<h4>85-bigml</h4>
BigML makes machine learning easy by taking care of the details required to add data-driven decisions and predictive power to your company. Unlike other machine learning services, BigML creates beautiful predictive models that can be easily understood and interacted with.

<h4>86-jvm</h4>
A Java virtual machine (JVM) is an abstract computing machine that enables a computer to run a Java program. There are three notions of the JVM: specification, implementation, and instance. The specification is a document that formally describes what is required of a JVM implementation.

<h4>90-amazon-product-api</h4>
Amazon Product Advertising API client.

<h4>91-twitter-stream</h4>
The Streaming APIs give developers low latency access to Twitter's global stream of Tweet data.

<h4>99-benchmark</h4>
Time a block of code with minimal effort.
Sometimes you want to time a certain execution path to see its performance. So, you add a bunch of time captures and log statements. Cleaning them up is not so much fun. It would also be nice to leave them in your code so they can be enabled at will. timeMe is meant to help in that situation.

<h4>99-parallel</h4>
Parallel enables easy multi-thread processing.

## Copyright and license

Copyright 2014, 2015, 2016 Natural Intelligence Solutions. under [the Apache 2.0 license](LICENSE).

Most of these nodes are experimental. Use at your own risk.

</body></html>
