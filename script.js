document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要交互的元素
    const contentStage1 = document.getElementById('content-stage-1');
    const contentStage2 = document.getElementById('content-stage-2');
    const contentStage3 = document.getElementById('content-stage-3');
    const contentStageFinal = document.getElementById('content-stage-final');
    
    const nextBtn = document.getElementById('nextBtn');
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const mainHeart = document.getElementById('mainHeart');
    
    // 当前展示阶段
    let currentStage = 1;
    
    // 设置当前日期
    const now = new Date();
    if(document.getElementById('current-date')) {
        document.getElementById('current-date').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
    
    // 禁用双击缩放
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // 音频处理函数 - 优化版
    function setupAudio() {
        const bgMusic = document.getElementById('bgMusic');
        const musicControl = document.getElementById('musicControl');
        const backupPlayButton = document.getElementById('backupPlayButton');
        
        // 设置初始音量
        bgMusic.volume = 0.6;
        
        // 标记是否是第一次播放和加载状态
        let isFirstPlay = true;
        let isLoading = true;
        let loadStartTime = Date.now();
        let audioContext = null;
        
        // 添加音频加载状态指示器
        musicControl.classList.add('music-loading');
        
        // 尝试使用AudioContext API优化音频加载
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (window.AudioContext) {
                audioContext = new AudioContext();
                
                // 如果AudioContext处于挂起状态，等待用户交互来恢复
                if (audioContext.state === 'suspended') {
                    document.addEventListener('click', function resumeAudioContext() {
                        audioContext.resume();
                        document.removeEventListener('click', resumeAudioContext);
                    }, {once: true});
                }
            }
        } catch (e) {
            console.log('AudioContext不受支持，使用标准HTML5音频');
        }
        
        // 处理音频加载错误
        bgMusic.addEventListener('error', function(e) {
            console.error('音频加载错误:', e);
            backupPlayButton.classList.add('show');
            backupPlayButton.textContent = '音频加载失败，点击重试';
            musicControl.classList.remove('music-loading');
            
            // 使用备用加载方法
            retryLoadAudio();
        });
        
        // 备用音频加载方法
        function retryLoadAudio() {
            const audioSrc = bgMusic.querySelector('source');
            if (audioSrc) {
                const basePath = window.location.href.replace(/\/[^\/]*$/, '/');
                audioSrc.src = basePath + 'background-music.mp3';
                bgMusic.load();
                
                // 重置加载时间
                loadStartTime = Date.now();
            }
        }
        
        // 监听音频可以播放的事件
        bgMusic.addEventListener('canplay', function() {
            const loadTime = Date.now() - loadStartTime;
            console.log(`音频加载完成，耗时: ${loadTime}ms`);
            
            isLoading = false;
            musicControl.classList.remove('music-loading');
        });
        
        // 使用缓冲检查优化音频加载监控
        let bufferCheckInterval = setInterval(function() {
            // 如果已经不在加载中，清除间隔
            if (!isLoading) {
                clearInterval(bufferCheckInterval);
                return;
            }
            
            // 检查缓冲区
            if (bgMusic.readyState >= 3) { // HAVE_FUTURE_DATA = 3, HAVE_ENOUGH_DATA = 4
                isLoading = false;
                musicControl.classList.remove('music-loading');
                clearInterval(bufferCheckInterval);
                console.log('音频已缓冲足够数据可以流畅播放');
            }
        }, 1000);
                    
        // 确保DOM已加载完成后预加载音频
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            prepareAudio();
        } else {
            window.addEventListener('DOMContentLoaded', prepareAudio);
        }
        
        function prepareAudio() {
            // 确保设置了预加载
            bgMusic.preload = 'auto';
            
            // 使用requestIdleCallback在浏览器空闲时预加载音频
            const idleCallback = window.requestIdleCallback || function(callback) {
                setTimeout(callback, 1);
            };
            
            idleCallback(() => {
                try {
                    const silentPlay = bgMusic.play();
                    if (silentPlay) {
                        silentPlay.then(() => {
                            bgMusic.pause();
                            bgMusic.currentTime = 0;
                            isLoading = false;
                            musicControl.classList.remove('music-loading');
                        }).catch(() => {
                            // 自动播放被阻止，这是正常的
                            backupPlayButton.classList.add('show');
                        });
                    }
                } catch (e) {
                    console.log('音频预加载错误:', e);
                    backupPlayButton.classList.add('show');
                }
            });
        }
        
        // 播放音乐并添加旋转效果
        function playMusic() {
            if (isLoading) {
                // 防止多次点击，设置反馈
                if (!backupPlayButton.classList.contains('show')) {
                    backupPlayButton.textContent = '音频加载中...';
                    backupPlayButton.classList.add('show');
                }
                return;
            }
            
            if (isFirstPlay) {
                bgMusic.currentTime = 17; // 第一次从17秒开始
                isFirstPlay = false;
            }
            
            // 恢复AudioContext，如果存在
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // 使用Promise播放
            const playPromise = bgMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    musicControl.classList.add('music-rotating');
                    backupPlayButton.classList.remove('show');
                }).catch((e) => {
                    console.log('播放失败:', e);
                    backupPlayButton.classList.add('show');
                    
                    // 错误处理优化
                    if (e.name === 'NotAllowedError') {
                        backupPlayButton.textContent = '点击播放音乐';
                    } else {
                        backupPlayButton.textContent = '播放失败，点击重试';
                        
                        // 智能重载
                        if (bgMusic.networkState === 2 || bgMusic.networkState === 3) { // NETWORK_LOADING = 2, NETWORK_NO_SOURCE = 3
                            bgMusic.load();
                            isLoading = true;
                            musicControl.classList.add('music-loading');
                        }
                    }
                });
            }
        }

        // 暂停音乐并移除旋转效果
        function pauseMusic() {
            bgMusic.pause();
            musicControl.classList.remove('music-rotating');
            
            // 如果有AudioContext，暂停它以节省资源
            if (audioContext && audioContext.state === 'running') {
                // 在某些浏览器中可能会暂停所有音频
                // audioContext.suspend();
            }
        }

        // 监听循环开始事件
        bgMusic.addEventListener('loop', () => {
            bgMusic.currentTime = 0; // 确保循环从头开始
        });

        // 使用事件委托减少事件监听器数量
        document.addEventListener('click', function(e) {
            // 音乐控制按钮点击
            if (e.target.closest('#musicControl')) {
                if (isLoading) {
                    backupPlayButton.textContent = '音频加载中...';
                    backupPlayButton.classList.add('show');
                    return;
                }
                
                if (bgMusic.paused) {
                    playMusic();
                } else {
                    pauseMusic();
                }
                return;
            }
            
            // 备用播放按钮点击
            if (e.target.closest('#backupPlayButton')) {
                if (isLoading) {
                    bgMusic.load();
                    backupPlayButton.textContent = '音频重新加载中...';
                } else {
                    playMusic();
                }
                return;
            }
            
            // 页面点击自动播放
            if (bgMusic.paused && !isLoading && !window.hasPlayedMusic) {
                // 设置一次性标记，避免重复触发
                window.hasPlayedMusic = true;
                playMusic();
            }
        });
        
        // 处理音频意外暂停或缓冲
        bgMusic.addEventListener('waiting', function() {
            isLoading = true;
            musicControl.classList.add('music-loading');
            musicControl.classList.remove('music-rotating');
        });
        
        // 音频恢复播放
        bgMusic.addEventListener('playing', function() {
            isLoading = false;
            musicControl.classList.remove('music-loading');
            musicControl.classList.add('music-rotating');
        });
        
        // 添加媒体会话控制，优化移动设备上的体验
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: '给小明的告白信',
                artist: '眭时康',
                artwork: [
                    { src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"%3E%3Cpath d="M48,12 C30,12 12,30 12,48 C12,66 30,84 48,84 C66,84 84,66 84,48 C84,30 66,12 48,12 Z" fill="%23ffb6c1"/%3E%3Cpath d="M48,36 C42,36 36,42 36,48 C36,60 48,72 48,72 C48,72 60,60 60,48 C60,42 54,36 48,36 Z" fill="%23ff4d6d"/%3E%3C/svg%3E', sizes: '96x96', type: 'image/svg+xml' }
                ]
            });
            
            navigator.mediaSession.setActionHandler('play', playMusic);
            navigator.mediaSession.setActionHandler('pause', pauseMusic);
        }
    }
    
    // 创建漂浮爱心背景
    function createFloatingHearts() {
        const container = document.querySelector('.floating-hearts');
        const heartCount = Math.min(12, Math.floor(window.innerWidth / 50)); // 减少心形数量

        // 使用DocumentFragment优化DOM操作
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = '❤';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDelay = Math.random() * 8 + 's';
            fragment.appendChild(heart);
        }
        container.appendChild(fragment);
    }

    // 优化的心形爆发效果
    const debouncedCreateHeartBurst = debounce(function() {
        const hearts = Math.min(6, Math.floor(window.innerWidth / 80));
        const container = document.body;
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < hearts; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤';
            heart.style.cssText = `
                position: fixed;
                left: 50%;
                top: 50%;
                color: #ff4d6d;
                font-size: 20px;
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                animation: float ${2 + Math.random() * 1}s linear forwards;
            `;
            fragment.appendChild(heart);
            
            setTimeout(() => heart.remove(), 2000);
        }
        container.appendChild(fragment);
    }, 100);

    // 优化的烟花效果
    const debouncedCreateFireworks = debounce(function() {
        const colors = ['#ff4d6d', '#ff85a1', '#ffc0cb', '#ff69b4'];
        const particleCount = Math.min(30, Math.floor(window.innerWidth / 25));
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < particleCount; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            fragment.appendChild(firework);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 2;
            const size = Math.random() * 3 + 1;
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.width = size + 'px';
            firework.style.height = size + 'px';
            
            requestAnimationFrame(() => {
                document.body.appendChild(fragment);
                animateFirework(firework, angle, velocity);
            });
        }
    }, 100);

    function animateFirework(firework, angle, velocity) {
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 2;
            let x = startX;
            let y = startY;
            
        function animate() {
                x += Math.cos(angle) * velocity;
                y += Math.sin(angle) * velocity - 0.5;
                
                // 使用transform而不是left/top提高性能
                firework.style.transform = `translate(${x}px, ${y}px)`;
                
                if (y < window.innerHeight) {
                    requestAnimationFrame(animate);
                } else {
                    firework.remove();
                }
        }
        
        requestAnimationFrame(animate);
    }
    
    // 按钮躲避效果
    function setupButtonDodge() {
        let lastTouchTime = 0;
        const noBtnTexts = [
            "再想想",
            "不要嘛～",
            "再考虑一下嘛",
            "别点我～",
            "再思索一下呀",
            "讨厌啦～",
            "你就答应嘛",
            "给个机会嘛",
            "你忍心拒绝我吗",
            "我会难过的～"
        ];
        let textIndex = 0;
        
        function handleButtonDodge(e) {
            const now = Date.now();
            if (now - lastTouchTime < 100) return;
            lastTouchTime = now;
            
            const noBtn = document.getElementById('noBtn');
            const container = document.querySelector('.dodge-container');
            
            // 第一次触发时，将按钮移动到dodge-container中，但保持原始位置
            if (noBtn.classList.contains('initial')) {
                // 获取按钮当前位置
                const btnRect = noBtn.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // 计算相对于dodge-container的位置
                const initialX = btnRect.left - containerRect.left;
                const initialY = btnRect.top - containerRect.top;
                
                // 先设置初始位置，然后再添加到新容器
                noBtn.style.left = initialX + 'px';
                noBtn.style.top = initialY + 'px';
                
                // 添加moving类，但暂时不应用过渡效果
                noBtn.classList.add('no-transition');
                noBtn.classList.remove('initial');
                container.appendChild(noBtn);
                
                // 强制重绘，确保位置已应用
                noBtn.offsetHeight; 
                
                // 移除no-transition类，在下一次布局循环应用过渡效果
                requestAnimationFrame(() => {
                    noBtn.classList.remove('no-transition');
                    // 在此之后的下一帧再应用moving类
                    requestAnimationFrame(() => {
                        noBtn.classList.add('moving');
                        // 计算新位置并移动
                        moveToNewPosition();
                    });
                });
            } else {
                // 后续点击直接移动到新位置
                moveToNewPosition();
            }
            
            function moveToNewPosition() {
                const containerRect = container.getBoundingClientRect();
                
                // 计算可移动范围
                const maxX = containerRect.width - noBtn.offsetWidth;
                const maxY = containerRect.height - noBtn.offsetHeight;
                
                // 生成新位置
                const newX = Math.random() * maxX;
                const newY = Math.random() * maxY;
                
                // 应用新位置
                noBtn.style.left = newX + 'px';
                noBtn.style.top = newY + 'px';
                
                // 更改按钮文字
                noBtn.textContent = noBtnTexts[textIndex];
                textIndex = (textIndex + 1) % noBtnTexts.length;
            }
        }
        
        const noBtn = document.getElementById('noBtn');
        // 使用事件委托减少事件监听器
        noBtn.addEventListener('mouseover', handleButtonDodge);
        noBtn.addEventListener('touchstart', handleButtonDodge);
    }
    
    // "好呀"按钮点击效果
    function handleSuccess(e) {
        if (e) e.preventDefault();
        
        // 隐藏所有阶段
        contentStage1.classList.remove('active');
        contentStage2.classList.remove('active');
        contentStage3.classList.remove('active');
        
        // 显示最终阶段
        contentStageFinal.classList.add('active');
        
        // 更新日期
        const now = new Date();
        if(document.getElementById('current-date')) {
            document.getElementById('current-date').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        }
        
        // 确保音乐在点击"好呀"后播放
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic.paused) {
            bgMusic.play().catch(error => console.log('无法自动播放音乐:', error));
            document.getElementById('musicControl').classList.add('music-rotating');
        }
        
        // 添加特效
        debouncedCreateFireworks();
        debouncedCreateHeartBurst();
        
        // 隐藏按钮
        nextBtn.style.display = 'none';
        noBtn.style.display = 'none';
        yesBtn.style.display = 'none';
    }
    
    // 切换到下一个阶段
    function nextStage() {
        // 隐藏所有阶段
        contentStage1.classList.remove('active');
        contentStage2.classList.remove('active');
        contentStage3.classList.remove('active');
        contentStageFinal.classList.remove('active');
        
        // 切换阶段
        currentStage++;
        
        // 根据当前阶段显示内容
        if (currentStage === 2) {
            contentStage2.classList.add('active');
            nextBtn.textContent = '还有更多';
        } else if (currentStage === 3) {
            contentStage3.classList.add('active');
            nextBtn.textContent = '回到开始';
        } else {
            currentStage = 1;
            contentStage1.classList.add('active');
            nextBtn.textContent = '继续了解';
        }
        
        // 特效
        debouncedCreateHeartBurst();
    }
    
    // 优化点击和触摸事件
    let touchTimeout;
    mainHeart.addEventListener('click', debounce(debouncedCreateHeartBurst, 300));
    mainHeart.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (touchTimeout) clearTimeout(touchTimeout);
        touchTimeout = setTimeout(debouncedCreateHeartBurst, 300);
    });

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 设置按钮事件 - 使用事件委托减少监听器
    function setupButtons() {
        let yesClickCount = 0;
        const confirmTexts = [
            "真的吗？人家好开心呀~",
            "再说一次嘛，人家还想听~",
            "太好啦！我们在一起吧！"
        ];
        
        // 使用事件委托处理按钮点击
        document.addEventListener('click', function(e) {
            // Yes按钮点击
            if (e.target.id === 'yesBtn') {
                e.preventDefault();
                yesClickCount++;
                
                // 创建心形特效
                debouncedCreateHeartBurst();
                
                if (yesClickCount < 3) {
                    // 更新按钮文字
                    e.target.textContent = confirmTexts[yesClickCount - 1];
                    
                    // 添加按钮动画
                    e.target.classList.add('button-pulse');
                    setTimeout(() => e.target.classList.remove('button-pulse'), 500);
                } else {
                    // 第三次点击时执行成功效果
                    handleSuccess();
                }
                return;
            }
            
            // Next按钮点击
            if (e.target.id === 'nextBtn') {
                nextStage();
                return;
            }
            
            // 导航按钮点击
            if (e.target.id === 'goto-links') {
                switchToStage('content-stage-links');
                return;
            }
            
            if (e.target.id === 'back-to-final') {
                switchToStage('content-stage-final');
                return;
            }
            
            if (e.target.id === 'goto-more') {
                switchToStage('content-stage-more');
                return;
            }
            
            if (e.target.id === 'back-to-links') {
                switchToStage('content-stage-links');
                return;
            }
            
            if (e.target.id === 'goto-end') {
                switchToStage('content-stage-end');
                return;
            }
            
            if (e.target.id === 'back-to-more') {
                switchToStage('content-stage-more');
                return;
            }
            
            if (e.target.id === 'back-to-home') {
                switchToStage('content-stage-1');
                return;
            }
        });
        
        // 处理触摸事件
        document.addEventListener('touchstart', function(e) {
            if (e.target.id === 'yesBtn') {
                e.preventDefault();
                e.target.click();
            }
            
            if (e.target.id === 'nextBtn') {
                e.preventDefault();
                nextStage();
            }
        });
    }
    
    // 切换页面函数
    function switchToStage(stageId) {
        // 隐藏所有页面
        document.querySelectorAll('.content-stage').forEach(stage => {
            stage.classList.remove('active');
        });
        
        // 显示目标页面
        document.getElementById(stageId).classList.add('active');
        
        // 处理主按钮容器的显示/隐藏
        const mainButtons = document.getElementById('main-buttons');
        const nextBtn = document.getElementById('nextBtn');
        const yesBtn = document.getElementById('yesBtn');
        const noBtn = document.getElementById('noBtn');
        
        if (stageId === 'content-stage-1' || stageId === 'content-stage-2' || stageId === 'content-stage-3') {
            mainButtons.style.display = 'flex';
            nextBtn.style.display = 'inline-block';
            yesBtn.style.display = 'inline-block';
            noBtn.style.display = 'inline-block';
            
            // 重置按钮状态
            if (stageId === 'content-stage-1') {
                nextBtn.textContent = '继续了解';
                yesBtn.textContent = '好呀';
                noBtn.textContent = '再想想';
                noBtn.className = 'initial';
            }
        } else {
            mainButtons.style.display = 'none';
        }
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    }
    
    // 设置页面导航事件 - 使用事件委托优化
    function setupNavigation() {
        // 链接和功能按钮事件
        document.addEventListener('click', function(e) {
            // 链接按钮点击
            if (e.target.classList.contains('link-button')) {
                showToast("敬请期待～");
                return;
            }
            
            // 功能按钮点击
            if (e.target.classList.contains('feature-button')) {
                showToast("功能开发中，敬请期待～");
                return;
            }
        });
    }
    
    // 显示提示信息
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        // 使用setTimeout而不是setInterval，更高效
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.textContent = "敬请期待～";
            }, 300);
        }, 3000);
    }
    
    // 初始化 - 优化执行顺序
    function init() {
        // 优先初始化音频
        setupAudio();
        
        // 其他初始化可以稍后进行
        requestAnimationFrame(() => {
            setupButtons();
            setupNavigation();
        });
        
        // 使用requestIdleCallback处理非关键任务
        const idleCallback = window.requestIdleCallback || setTimeout;
        idleCallback(() => {
            createFloatingHearts();
            setupButtonDodge();
        });
    }
    
    // 优化页面加载初始化
    if (document.readyState === 'complete') {
        init();
    } else if (document.readyState === 'interactive') {
        // 页面可交互时初始化核心功能
        setupAudio();
        
        // 其他功能等待完全加载后初始化
        window.addEventListener('load', () => {
            requestAnimationFrame(() => {
                setupButtons();
                setupNavigation();
                createFloatingHearts();
                setupButtonDodge();
            });
        });
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }
    
    // 添加页面可见性API支持，优化后台标签页的资源使用
    document.addEventListener('visibilitychange', function() {
        const bgMusic = document.getElementById('bgMusic');
        
        if (document.hidden) {
            // 页面不可见时，可以考虑暂停音乐，根据需求选择是否启用
            // if (!bgMusic.paused) {
            //     bgMusic.pause();
            // }
        } else {
            // 页面重新可见
            // if (bgMusic.dataset.wasPlaying === 'true') {
            //     bgMusic.play().catch(e => console.log('无法恢复播放:', e));
            // }
        }
    });
}); 
