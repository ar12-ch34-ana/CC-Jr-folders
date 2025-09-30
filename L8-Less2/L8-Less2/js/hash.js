(function ($) {

    function Hash(config) {
        this.config = config || {};
        this.initialStates = {};
        this.init();
    }

    Hash.prototype = {
        normalizeAnswer: function(answer) {
            if (answer === null || answer === undefined) return "";
            return answer.toString().toLowerCase().trim();
        },
        init: function () {
            var _this = this;

            $(document).ready(function () {
                $('main').each(function () {
                    var $main = $(this);
                    var totalQuestions = $main.find('.question').length;
                    console.log("Total questions:", totalQuestions);
                    console.log("Level:", $('main').data('level') || 1);
                    console.log("Lesson:", $('main').data('lesson') || 1);

                    // Initialize questions
                    $main.find('.question').each(function () {
                        var questionClass = $(this).attr('class').split(' ').find(c => c.startsWith('q'));
                        _this.initialStates[questionClass] = $(this).html();
                        $(this).hide();
                    });

                    // Get current level and lesson
                    var currentLevel = $main.data('level') || 1;
                    var currentLesson = $main.data('lesson') || 1;
                    var storageKey = `Level${currentLevel}-Lesson${currentLesson}`;

                    // Helper functions for localStorage
                    function getStorageData(key, defaultValue) {
                        try {
                            const allData = JSON.parse(localStorage.getItem(storageKey)) || {};
                            return key ? (allData[key] || defaultValue) : allData;
                        } catch (e) {
                            console.error("Error retrieving data:", e);
                            return defaultValue;
                        }
                    }

                    function setStorageData(key, value) {
                        try {
                            const allData = getStorageData();
                            if (key) {
                                allData[key] = value;
                            }
                            localStorage.setItem(storageKey, JSON.stringify(allData));
                        } catch (e) {
                            console.error("Error storing data:", e);
                        }
                    }

                    // Load stored data
                    var storedAnswers = getStorageData('storedAnswers', {});
                    var questionCorrectStatus = getStorageData('questionCorrectStatus', {});

                    // Apply stored answers
                    $(".question").each(function () {
                        var $question = $(this);
                        var questionId = $question.attr("id");
                        var savedAnswer = storedAnswers[questionId];
                    
                        if (savedAnswer) {
                            var correctAnswer = $question.find(".answer").data("answer");
                            var isCorrect = _this.normalizeAnswer(savedAnswer) === _this.normalizeAnswer(correctAnswer);
                    
                            $question.attr("data-correct", isCorrect);
                            questionCorrectStatus[questionId] = isCorrect;
                    
                            $question.find(".box.ans-select").each(function () {
                                var optionText = $(this).find('p').text().trim();
                                if (_this.normalizeAnswer(optionText) === _this.normalizeAnswer(savedAnswer)) {
                                    $(this).addClass("selected");
                                }
                            });
                        }
                    });

                    setStorageData('questionCorrectStatus', questionCorrectStatus);


                    // Show correct question on load
                    function showCorrectQuestionOnLoad() {
                        var storedIndex = getStorageData('currentQuestionIndex', 1);
                        var currentQuestionIndex = Math.max(1, Math.min(parseInt(storedIndex, 10) || 1, totalQuestions));

                        var $questionToShow = $(".question").eq(currentQuestionIndex - 1);
                        $(".question").removeClass('active').hide();
                        $questionToShow.addClass('active').show();

                        $('.counter').text(currentQuestionIndex + ' / ' + totalQuestions);

                        var maxVisited = getStorageData('maxVisitedSlide', 1);
                        if (parseInt(maxVisited) < currentQuestionIndex) {
                            setStorageData('maxVisitedSlide', currentQuestionIndex);
                        }

                        setTimeout(_this.updateNavigationButtonStates, 100);
                    }

                    // Event handlers
                    $('.counter').on('click', function () {
                        var currentText = $(this).text();
                        var currentValue = parseInt(currentText.split('/')[0].trim());

                        $(this).html('<input type="number" class="counter-input" min="1" max="' + totalQuestions + '" value="' + currentValue + '">/' + totalQuestions);
                        $('.counter-input').focus().select();

                        // Handle input completion

                        $('.counter-input').on('blur keypress', function (e) {
                            if (e.type === 'blur' || e.which === 13) {
                                var inputValue = $(this).val();

                                // If input is empty or not a valid number, show the current slide number
                                if (inputValue === '' || isNaN(parseInt(inputValue))) {
                                    // Get the current slide number from the active question
                                    var currentIndex = $('.question').index($('.question.active')) + 1;
                                    $('.counter').text(currentIndex + ' / ' + totalQuestions);
                                    return;
                                }

                                var requestedSlide = parseInt(inputValue);
                                var maxVisitedSlide = parseInt(getStorageData('maxVisitedSlide', 1));

                                requestedSlide = Math.max(1, Math.min(requestedSlide, maxVisitedSlide, totalQuestions));
                                _this.navigateToSlide(requestedSlide, currentLevel, currentLesson);
                                $('.counter').text(requestedSlide + ' / ' + totalQuestions);
                            }
                        });
                    });

                    $(".next-btn").on("click", function () {
                        var $currentQuestion = $(".question.active");
                        if ($currentQuestion.hasClass("assessment") && $currentQuestion.attr("data-correct") !== "true") {
                            return;
                        }

                        var $nextQuestion = $currentQuestion.next('.question');
                        if ($nextQuestion.length) {
                            $currentQuestion.removeClass('active').hide();
                            $nextQuestion.addClass('active').show();

                            var nextIndex = $main.find('.question').index($nextQuestion) + 1;
                            setStorageData('currentQuestionIndex', nextIndex);

                            var maxVisited = parseInt(getStorageData('maxVisitedSlide', 1));
                            if (nextIndex > maxVisited) {
                                setStorageData('maxVisitedSlide', nextIndex);
                            }

                            $('.counter').text(nextIndex + ' / ' + totalQuestions);
                            setTimeout(_this.updateNavigationButtonStates, 100);
                        }
                    });

                    $(".prev-btn").on("click", function () {
                        var $currentQuestion = $(".question.active");
                        var $prevQuestion = $currentQuestion.prev('.question');
                        if ($prevQuestion.length) {
                            $currentQuestion.removeClass('active').hide();
                            $prevQuestion.addClass('active').show();

                            var prevIndex = $main.find('.question').index($prevQuestion) + 1;
                            setStorageData('currentQuestionIndex', prevIndex);
                            $('.counter').text(prevIndex + ' / ' + totalQuestions);
                            setTimeout(_this.updateNavigationButtonStates, 100);
                        }
                    });

                    $(document).on("keydown", function (e) {
                        // Close popup if open
                        if ($("#congrats-popup").is(":visible")) {
                            $("#congrats-popup").dialog("close");
                        }

                        if (e.key === "ArrowLeft") {
                            $(".prev-btn").click();
                        } else if (e.key === "ArrowRight") {
                            $(".next-btn").click();
                        }
                    });

                    $('.box.ans-select').on('click', function () {
                        var $currentQuestion = $(this).closest(".question");
                        var questionId = $currentQuestion.attr("id");
                        
                        // Get selected text from the p tag inside the clicked box
                        var selectedText = $(this).find('p').text().trim();
                        
                        // Get correct answer from the .answer div's data-answer attribute
                        var correctAnswer = $currentQuestion.find(".answer").data("answer");
                        
                        var isCorrect = _this.normalizeAnswer(selectedText) === _this.normalizeAnswer(correctAnswer);
                        
                        console.log("=== SELECTION DEBUG ===");
                        console.log("Selected text:", selectedText);
                        console.log("Correct answer:", correctAnswer);
                        console.log("Is correct:", isCorrect);
                        console.log("=====================");
                    
                        // Update stored answers
                        var storedAnswers = getStorageData('storedAnswers', {});
                        storedAnswers[questionId] = selectedText;
                        setStorageData('storedAnswers', storedAnswers);
                    
                        // Update UI
                        $(this).siblings().removeClass('selected');
                        $(this).addClass('selected');
                    
                        // Store selection status
                        var selectionStatus = getStorageData('questionSelectionStatus', {});
                        selectionStatus[questionId] = {
                            selected: true,
                            verified: false,
                            answer: selectedText,
                            isCorrect: isCorrect
                        };
                        setStorageData('questionSelectionStatus', selectionStatus);
                    
                        if (!$currentQuestion.hasClass("assessment")) {
                            $currentQuestion.attr("data-correct", isCorrect);
                            var questionCorrectStatus = getStorageData('questionCorrectStatus', {});
                            questionCorrectStatus[questionId] = isCorrect;
                            setStorageData('questionCorrectStatus', questionCorrectStatus);
                            _this.updateNavigationButtonStates();
                        }
                    });

                    //     $(this).css('background-color', '#6A3B88');
                    
                    //     var $currentQuestion = $(".question.active");
                    //     var questionId = $currentQuestion.attr("id");
                    //     var selectedText = ($currentQuestion.find(".selected img").attr("alt") || $currentQuestion.find(".selected").text()).trim();
                    //     var correctAnswer = $currentQuestion.find(".answer").data("answer");
                    
                    //     // Convert both to strings for comparison, then normalize
                    //     var normalizedSelected = selectedText.toString().toLowerCase().trim();
                    //     var normalizedCorrect = correctAnswer.toString().toLowerCase().trim();
                    
                    //     console.log("Assessment Type:", $currentQuestion.data('assessment'));
                    //     console.log("Correct Answer:", correctAnswer, "(type:", typeof correctAnswer, ")");
                    //     console.log("User Selected Answer:", selectedText, "(type:", typeof selectedText, ")");
                    //     console.log("Normalized Correct:", normalizedCorrect);
                    //     console.log("Normalized Selected:", normalizedSelected);
                    //     console.log("Is Correct?", normalizedSelected === normalizedCorrect);
                    
                    //     _this.checkAnswers(currentLevel, currentLesson);
                    // });

                    // Initialize
                    $('.submit-btn').click(function () {
                        $(this).css('background-color', '#6A3B88');
                    
                        var $currentQuestion = $(".question.active");
                        var questionId = $currentQuestion.attr("id");
                        
                        // Get the selected answer text from the p tag
                        var selectedText = $currentQuestion.find(".selected p").text().trim();
                        var correctAnswer = $currentQuestion.find(".answer").data("answer");
                    
                        console.log("Assessment Type:", $currentQuestion.data('assessment'));
                        console.log("Correct Answer:", correctAnswer, "(type:", typeof correctAnswer, ")");
                        console.log("User Selected Answer:", selectedText, "(type:", typeof selectedText, ")");
                        console.log("Normalized Correct:", _this.normalizeAnswer(correctAnswer));
                        console.log("Normalized Selected:", _this.normalizeAnswer(selectedText));
                        console.log("Is Correct?", _this.normalizeAnswer(selectedText) === _this.normalizeAnswer(correctAnswer));
                        console.log("==================");
                    
                        _this.checkAnswers(currentLevel, currentLesson);
                    });
                    
                    showCorrectQuestionOnLoad();
                });
            });

            this.lessonData = {};
        },

        updateNavigationButtonStates: function () {
            var $currentQuestion = $(".question.active");
            var isAssessment = $currentQuestion.hasClass("assessment");
            var currentLevel = $('main').data('level') || 1;
            var currentLesson = $('main').data('lesson') || 1;
            var storageKey = `Level${currentLevel}-Lesson${currentLesson}`;

            if (isAssessment) {
                try {
                    var allData = JSON.parse(localStorage.getItem(storageKey)) || {};
                    var questionId = $currentQuestion.attr("id");
                    var selectionStatus = allData.questionSelectionStatus?.[questionId] || {};
                    var isVerified = selectionStatus.verified === true;

                    $(".next-btn").toggleClass("disabled", !isVerified).css({
                        "pointer-events": !isVerified ? "none" : "auto",
                        "opacity": !isVerified ? "0.4" : "1"
                    });
                } catch (e) {
                    console.error("Error updating navigation buttons:", e);
                }
            } else {
                $(".next-btn").removeClass("disabled").css({
                    "pointer-events": "auto",
                    "opacity": "1"
                });
            }
        },

        navigateToSlide: function (slideNumber, level, lesson) {
            var $allQuestions = $('main').find('.question');
            var totalQuestions = $allQuestions.length;
            var storageKey = `Level${level}-Lesson${lesson}`;

            slideNumber = Math.max(1, Math.min(slideNumber, totalQuestions));

            $('.question.active').removeClass('active').hide();
            var $targetQuestion = $allQuestions.eq(slideNumber - 1);
            $targetQuestion.addClass('active').show();

            try {
                var allData = JSON.parse(localStorage.getItem(storageKey)) || {};
                allData.currentQuestionIndex = slideNumber;
                localStorage.setItem(storageKey, JSON.stringify(allData));
                $('.counter').text(slideNumber + ' / ' + totalQuestions);
                this.updateNavigationButtonStates();
            } catch (e) {
                console.error("Error updating slide navigation:", e);
            }
        },
        
        checkQuestion: function ($question, level, lesson) {
            var questionType = $question.data('question');
            var assessmentType = $question.data('assessment');
            var correctAnswer = $question.find('.answer').data('answer');
            var isCorrect = false;
            var userAnswer = "";
        
            switch (questionType) {
                case "select":
                    // Get user answer from the selected p tag
                    userAnswer = $question.find(".selected p").text().trim();
                    isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(correctAnswer);
                    break;
                default:
                    break;
            }
        
            console.log("=== CHECK QUESTION DEBUG ===");
            console.log("User answer:", userAnswer);
            console.log("Correct answer:", correctAnswer);
            console.log("Is correct:", isCorrect);
            console.log("===========================");
        
            var storageKey = `Level${level}-Lesson${lesson}`;
            var questionId = $question.attr("id");
        
            try {
                var allData = JSON.parse(localStorage.getItem(storageKey)) || {};
        
                // Update selection status
                if (!allData.questionSelectionStatus) allData.questionSelectionStatus = {};
                if (allData.questionSelectionStatus[questionId]) {
                    allData.questionSelectionStatus[questionId].verified = true;
                } else {
                    allData.questionSelectionStatus[questionId] = {
                        selected: true,
                        verified: true,
                        answer: userAnswer,
                        isCorrect: isCorrect
                    };
                }
        
                // Update correct status
                if (!allData.questionCorrectStatus) allData.questionCorrectStatus = {};
                allData.questionCorrectStatus[questionId] = isCorrect;
        
                localStorage.setItem(storageKey, JSON.stringify(allData));
                $question.attr("data-correct", isCorrect ? "true" : "false");
        
            } catch (e) {
                console.error("Error updating question status:", e);
            }
        
            return {
                assessmentType: assessmentType,
                isCorrect: isCorrect,
            };
        },

        checkAnswers: function (level, lesson) {
            var _this = this;
            var $currentQuestion = $('.question.active');
            var $nextQuestion = $currentQuestion.next('.question');
            var result = _this.checkQuestion($currentQuestion, level, lesson);
            var isCorrect = result.isCorrect;

            if (isCorrect) {
                $currentQuestion.addClass('correct').removeClass('incorrect');
                $("#congrats-popup").html('<img src="./img/correct.png" class="result-image" />');
                $("#congrats-popup").dialog("open");

                if ($nextQuestion.length) {
                    _this.updateDatabaseForQuestion();
                } else {
                    try {
                        var storageKey = `Level${level}-Lesson${lesson}`;
                        var allData = JSON.parse(localStorage.getItem(storageKey)) || {};
                        delete allData.currentQuestionIndex;
                        localStorage.setItem(storageKey, JSON.stringify(allData));
                    } catch (e) {
                        console.error("Error clearing question index:", e);
                    }
                    _this.questionCompleted();
                    $('.popup').css('display', 'block');
                }
            } else {
                $currentQuestion.addClass('incorrect').removeClass('correct');
                $("#congrats-popup").html('<img src="./img/wrong.png" class="result-image" />');
                $("#congrats-popup").dialog("open");
            }
        },

        updateDatabaseForQuestion: function () {
            // Implementation for updating database for a question
        },

        questionCompleted: function () {
            // Implementation for when worksheet is completed
        }
    };

    // Initialize popup
    $("#congrats-popup").dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        draggable: false,
        closeOnEscape: true,
        dialogClass: "custom-overlay",
        open: function () {
            $(".ui-dialog-titlebar").hide();
            $(this).parent().css({
                position: 'fixed',
                width: '100%',
                height: '100%'
            }).find('.ui-dialog-content').css({
                width: '100%',
                height: '100%'
            });

            $(".next-btn-static, .prev-btn-static, header").addClass("disabled").css({
                "z-index": "unset"
            });
        },
        close: function () {
            var $currentQuestion = $(".question.active");
            var isCorrect = $currentQuestion.attr("data-correct") === "true";
            var currentLevel = $('main').data('level') || 1;
            var currentLesson = $('main').data('lesson') || 1;

            if (isCorrect) {
                $(".next-btn").removeClass("disabled").css({
                    "pointer-events": "auto",
                    "opacity": "1"
                });
            } else if ($currentQuestion.hasClass("assessment")) {
                $(".next-btn").addClass("disabled").css({
                    "pointer-events": "none",
                    "opacity": "0.4"
                }).show();
            }

            $(".prev-btn").removeClass("disabled").css({
                "pointer-events": "auto",
                "opacity": "1"
            });
        }
    });

    $("#congrats-popup").click(function (event) {
        if (event.target === this) {
            $(this).dialog("close");
            $(".next-btn-static, .prev-btn-static, header")
                .removeClass("disabled")
                .css({
                    "z-index": "1"
                });
        }
    });

    // Make Hash globally accessible
    window.Hash = Hash;
})(jQuery);